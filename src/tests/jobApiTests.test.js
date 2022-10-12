const { resolveSoa } = require('dns');
const http = require('http');
const { resolve } = require('path');

// The async handling in these tests, after alot of tweaking is almost
// right but still has issues.
// Specifically the tests are sometimes completing before the response handlers
// finish in some cases.  This is at least partially rooted in the fact that I am
// using jest, a unit test framework, to run tests that aren't unit tests.

async function httpWrapper(requestOptions, expectedStatus, dataFunc) {
  return new Promise((resolve, reject) => {
    http.request(requestOptions, (res) => {
      if (res.statusCode != expectedStatus) {
        reject(`expected status code ${expectedStatus}, got ${res.statusCode}`);
      }
      else {
        // failed expects in here don't seem to work
        // expect(res.statusCode).toBe(expectedStatus);
        res.on('data', (data) => {
          resolve(dataFunc ? dataFunc(data) : null);
        });
      }
    }).end();
  })
}

describe('unpaid jobs', () => {

  function requestOptions(profileId) {
    return {
      host: 'localhost',
      path: '/jobs/unpaid',
      port: '3001',
      headers: {
        'profile_id': profileId,
        'Content-Type': 'application/json'
      }
    };
  }

  test('client 4 has an unpaid job', async () => {
    await httpWrapper(requestOptions(4), 200, (data) => {
        const json = JSON.parse(data);
        expect(json.length).toBe(1);
    });
  });

  test('client 3 has no unpaid jobs', async () => {
    await httpWrapper(requestOptions(3), 200, (data) => {
        const json = JSON.parse(data);
        expect(json.length).toBe(0);
    });
  });

  test('contractor 8 has no unpaid jobs', async () => {
    await httpWrapper(requestOptions(8), 200, (data) => {
        const json = JSON.parse(data);
        expect(json.length).toBe(0);
    });
  });

  test('contractor 5 has no unpaid jobs', async () => {
    await httpWrapper(requestOptions(8), 200, (data) => {
        const json = JSON.parse(data);
        expect(json.length).toBe(0);
    });
  });

  test('contractor 7 has 2 unpaid jobs', async () => {
    await httpWrapper(requestOptions(7), 200, (data) => {
        const json = JSON.parse(data);
        expect(json.length).toBe(2);
    });
  });

});

describe('pay jobs', () => {

  function unpaidJobRequestOptions(profileId) {
    return {
      host: 'localhost',
      path: '/jobs/unpaid',
      port: '3001',
      headers: {
        'profile_id': profileId,
        'Content-Type': 'application/json'
      }
    };
  }
  function payJobRequestOptions(profileId, jobId) {
    return {
      host: 'localhost',
      path: `/jobs/${jobId}/pay`,
      port: '3001',
      method: 'POST',
      headers: {
        'profile_id': profileId,
        'Content-Type': 'application/json'
      }
    };
  }

  async function checkUnpaidJobs(clientId, jobId) {

    return await httpWrapper(unpaidJobRequestOptions(clientId), 200, (data) => {
      const json = JSON.parse(data);
      for (var i = 0; i < json.length; i++) {
        var job = json[i];
        if (job.id === jobId) {
          return true;
        }
      }
      return false;
    });
  }

  test('happy path pay for a job', async () => {
    const jobThatShouldBePayable = {
      jobId: 2,
      clientId: 1
    };

    // validate that it is unpaid before we start
    expect(checkUnpaidJobs(jobThatShouldBePayable.clientId, jobThatShouldBePayable.jobId)).resolves.toBe(true);

    await httpWrapper(
      payJobRequestOptions(jobThatShouldBePayable.clientId, jobThatShouldBePayable.jobId),
      200);

    // now it should not be payable
    expect(checkUnpaidJobs(jobThatShouldBePayable.clientId, jobThatShouldBePayable.jobId)).resolves.toBe(false);

  });

  test('already paid job should fail', () => {

  });

  test('balance too small', () => {

  })

  test('wrong profile ID', () => {

  })
});