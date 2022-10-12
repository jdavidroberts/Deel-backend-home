const express = require('express');
const bodyParser = require('body-parser');
const {sequelize, Job, Contract} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const app = express();
const {Op, LOCK} = require('sequelize');
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

// TODO - refactor out some DB accessor or similar classes so we don't 
// have all of this data access/query and DB knowledge here in the app
// code

/**
 * @returns contract by id
 */
app.get('/contracts/:id',getProfile ,async (req, res) =>{
    const {Contract} = req.app.get('models')
    const {id} = req.params
    const contract = await Contract.findOne({where: {id}})
    if(!contract) return res.status(404).end()
    const profileId = req.profile.id;
    if(contract.ClientId != profileId && contract.ContractorId != profileId) {
        return res.status(404).end();
    }
    res.json(contract)
})
/**
 * @returns contracts for the profile
 */
 app.get('/contracts', getProfile, async (req, res) =>{
    const {Contract} = req.app.get('models');
    const profile = req.profile;
    var where;
    if (profile.type === 'client') {
        where = {'ClientId': profile.id};
    }
    else {
        where = {'ContractorId': profile.id};
    }
    where.status = {
        [Op.ne]: 'terminated'
    }
    const contracts = await Contract.findAll({where: where});
    res.json(contracts);
});
/**
 * @returns unpaid jobs for the profile
 */
 app.get('/jobs/unpaid', getProfile, async (req, res) =>{
    const {Job, Contract} = req.app.get('models');
    const profile = req.profile;
    var contractWhere;
    if (profile.type === 'client') {
        contractWhere = {'ClientId': profile.id};
    }
    else {
        contractWhere = {'ContractorId': profile.id};
    }
    contractWhere.status = {
        [Op.ne]: 'terminated'
    }
    const jobs = await Job.findAll({
        // seems like this should be paid: false, but based on testing,
        // paid:null seems to do the trick.  Note that the sequelize
        // definition in model.js has a default to false.
        where: {
            paid: null
        },
        include: [{
            model: Contract,
            where: contractWhere,
            required: true
        }]
    });
    res.json(jobs);
});
/**
 * @returns best paying profession for a date range
 */
 app.get('/admin/best-profession', async (req, res) =>{
    const {Profile} = req.app.get('models');
    // TODO - some sort of validation that the caller is actually an admin
    const {start, end} = req.query;
    console.log(req.query);
    const professions = await Profile.findAll({
        attributes: ['profession', 
            [sequelize.fn('sum', sequelize.col('price')), 'total_price']],
        include: [{
            model: Contract,
            as: 'Contractor',
            required: true,
            attributes: [],
            include: [{
                model: Job,
                attributes: [],
                required: true,
                where: {
                    [Op.and]: [
                        {paymentDate: {
                            [Op.gt]: start
                        }},
                        {paymentDate: {
                            [Op.lt]: end
                        }}
                    ]
                }
            }]
        }],
        group: 'profession',
        limit: 1,
        subQuery: false,
        order: [['total_price', 'DESC']]
    });
    res.json(professions[0]);
});
/**
 * pays a job
 */
 app.post('/jobs/:id/pay', getProfile, async (req, res) =>{
    const {Job, Profile} = req.app.get('models');
    const {id} = req.params;
    const reqProfile = req.profile;
    if (reqProfile.type !== 'client') {
        // only clients can pay
        return res.status(401).end();
    }
    console.log(LOCK);
    await sequelize.transaction(async (t) => {
        var job = await Job.findOne({
            lock: t.LOCK.UPDATE,
            where: {
                id: id,
                paid: null
            },
            include: [{
                model: Contract,
                attributes: ['ContractorId'],
                where: {
                    'ClientId': reqProfile.id,
                    status: {
                        [Op.ne]: 'terminated'
                    }
                },
                required: true
            }]
        });
        if (!job) {
            return res.status(404).end('no unpaid job found for this ID');
        }
        var clientProfile = await Profile.findOne({
            lock: t.LOCK.UPDATE,
            where: {
                id: reqProfile.id
            }
        });
        if (job.price > clientProfile.balance) {
            return res.status(403).end('not enough funds');
        }
        var contractorProfile = await Profile.findOne({
            lock: t.LOCK.UPDATE,
            where: {
                id: job.Contract.ContractorId
            }
        });
        await Profile.update({
            balance: clientProfile.balance - job.price
        }, {
            where: {id: clientProfile.id}
        });
        await Profile.update({
            balance: contractorProfile.balance + job.price
        }, {
            where: {id: contractorProfile.id}
        });
        await Job.update({
            paid: true,
            paymentDate: (new Date()).toJSON()
        }, {
            where: {id: job.id}
        })
    })
    res.end('OK');
});
module.exports = app;
