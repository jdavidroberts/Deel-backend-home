const http = require('http');

// I am not handling the asynchronous nature of these tests correctly.
// See jobApiTests.test.js which is better but still not entirely correct

describe('contracts by ID', () => {

  function requestOptions(contractId, profileId) {
    return {
      host: 'localhost',
      path: `/contracts/${contractId}`,
      port: '3001',
      headers: {
        'profile_id': profileId,
        'Content-Type': 'application/json'
      }
    };
  }

  const knownGoodTestData = {
    'ContractId': 2,
    'ContractorId': 6,
    'ClientId': 1
  }

  test('no profile gives 401', () => {
    http.request("http://localhost:3001/contracts/2", (res) => {
      expect(res.statusCode).toBe(401);
    }).end();
  });

  test('happy path for a client', () => {
    http.request(requestOptions(knownGoodTestData.ContractId, knownGoodTestData.ClientId),
    (res) => {
      expect(res.statusCode).toBe(200);
      res.on('data', (data) => {
        const json = JSON.parse(data);
        expect(json.id).toBe(knownGoodTestData.ContractId);
        expect(json.ClientId).toBe(knownGoodTestData.ClientId);
        expect(json.ContractorId).toBe(knownGoodTestData.ContractorId);
      });
    }).end();
  });

  test('happy path for a contractor', () => {
    http.request(requestOptions(knownGoodTestData.ContractId, knownGoodTestData.ContractorId),
    (res) => {
      expect(res.statusCode).toBe(200);
      res.on('data', (data) => {
        const json = JSON.parse(data);
        expect(json.id).toBe(knownGoodTestData.ContractId);
        expect(json.ClientId).toBe(knownGoodTestData.ClientId);
        expect(json.ContractorId).toBe(knownGoodTestData.ContractorId);
      });
    }).end();
  });

  test('item #1 from the instructions.  Only return if the profile participates in the contract', () => {
    http.request(requestOptions(knownGoodTestData.ContractId, 5),
    (res) => {
      expect(res.statusCode).toBe(404);
    }).end();
  });
});

describe('contracts for a profile', () => {

  function requestOptions(profileId) {
    return {
      host: 'localhost',
      path: '/contracts',
      port: '3001',
      headers: {
        'profile_id': profileId,
        'Content-Type': 'application/json'
      }
    };
  }

  test('contractor 7 has 3 contracts', () => {
    http.request(requestOptions(7),
    (res) => {
      expect(res.statusCode).toBe(200);
      res.on('data', (data) => {
        const json = JSON.parse(data);
        expect(json.length).toBe(3);
      });
    }).end();
  });

  test('client 2 has 2 contracts', () => {
    http.request(requestOptions(2),
    (res) => {
      expect(res.statusCode).toBe(200);
      res.on('data', (data) => {
        const json = JSON.parse(data);
        expect(json.length).toBe(2);
      });
    }).end();
  });

  test('contractor 5 contract is terminated', () => {
    http.request(requestOptions(5),
    (res) => {
      expect(res.statusCode).toBe(200);
      res.on('data', (data) => {
        const json = JSON.parse(data);
        expect(json.length).toBe(0);
      });
    }).end();
  });

});
