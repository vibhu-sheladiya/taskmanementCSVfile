// tests/taskController.test.js

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');  // Point to the main app file

chai.use(chaiHttp);

describe('Task Management Tests', () => {
    // Test for exporting tasks to CSV
    it('should export tasks to CSV', (done) => {
        chai.request(app)
            .get('/tasks/export')
            .end((err, res) => {
                chai.expect(res.status).to.equal(200);
                chai.expect(res.header['content-type']).to.include('text/csv'); // Expecting CSV content-type
                done();
            });
    });

    // Test for importing tasks from CSV
    it('should import tasks from CSV', (done) => {
        chai.request(app)
            .post('/tasks/import')
            .attach('csvFile', 'tests/sample-tasks.csv')  // Mock CSV file
            .end((err, res) => {
                chai.expect(res.status).to.equal(201);
                done();
            });
    });
});
