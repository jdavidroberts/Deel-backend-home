Overall I have completed the first four bullets, and the 6th.

So the contracts/id endpoint is fixed, and the contracts, jobs/unpaid, jobs/id/pay,
and the /admin/best-profession endpoints are done.  The deposit and best-clients
endpoints are not done, but I think I could knock them out without too much
trouble at this point.  I think I have shown a working knowledge of sequelize,
including the joins associated with the best-profession endpoints and the
updates associated with the pay endpoint.  I did include a transaction and
used update locks when querying the data to update to avoid deadlock. 

There ARE tests for almost all of the done work.  The seed has to be run before the
tests (because the test of the pay endpoint has side effects).

I made a decision at the beginning to use jest tests instead of Postman to 
test.  I'm not sure if that was the right call.  I did find myself spending alot of time on the tests.  I got bogged
down in some of the async quirks in the tests.  See comments in jobApiTests.test.js for
more info.

app.js needs to be broken up.  Business logic objects need to be factored out.

I have not been a full time programmer for quite a while, so I found myself
having to Google for samples that would give me the details of how to implement
what I knew conceptually.  This wound up bogging me down in the tests and
also took some time as I sorted out the joins in sequelize.  I also shied
away from breaking out the business logic for fear of getting bogged down in
the details of properly implementing and referencing an object in a separate
file.  I am confident I would quickly pick up the needed details if I were
routinely writing new code like this.