const http = require('http');

// I am not handling the asynchronous nature of these tests correctly.
// See jobApiTests.test.js which is better but still not entirely correct

describe('best profession', () => {

  function requestOptions(startDate, endDate) {
    return {
      host: 'localhost',
      path: `/admin/best-profession?start=${startDate.toJSON()}&end=${endDate.toJSON()}`,
      port: '3001',
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  test('query across very wide date range', () => {
    http.request(requestOptions(new Date('1990-01-01'), new Date('2050-01-01')),
    (res) => {
      expect(res.statusCode).toBe(200);
      res.on('data', (data) => {
        const json = JSON.parse(data);
        expect(json.profession).toBe('Programmer');
      });
    }).end();
  });

  test('query August 10', () => {
    http.request(requestOptions(new Date('2020-08-10'), new Date('2020-08-11')),
    (res) => {
      expect(res.statusCode).toBe(200);
      res.on('data', (data) => {
        const json = JSON.parse(data);
        expect(json.profession).toBe('Musician');
      });
    }).end();
  });

});