const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const validUrl = require('valid-url');
const kue = require('kue');
const queue = kue.createQueue();

const fetchUrlJob = queue.create('fetchUrl');

queue.process('fetchUrl', function(job, done) {
    const { id: jobId, url } = job.data;

    fetch(url)
	.then(res => res.text())
	.then(body => {
	    Job.findById(jobId, (err, job) => {
		if (err) {
		    return done(new Error(`No such jobId: ${jobId}`));
		}

		job.update({ status: 'done', response: body }).exec();
		done();
	    });
	})
	.catch(err => {
	    console.log(`Could not fetch contents of "${url}"`);
	    Job.findById(jobId, (err, job) => {
		if (err) {
		    return done(new Error(`Could not fetch contents of "${url}"`));
		}
		
		job.update({ status: 'error' }).exec();
		done();
	    });
	});
});

mongoose.connect('mongodb://localhost/local', { useNewUrlParser: true });

const { Schema, model } = mongoose;

const JobSchema = new Schema({
    url: { type: String, required: true },
    status: { type: String, default: 'pending' },
    response: { type: String }
});

const Job = model('Job', JobSchema);

// `node-fetch` complains if schema is missing
// (it wants `http://www.google.com`; not `www.google.com`)
const normalizeUrl = (url) => {
    const hasHttp = /^http/.test(url);

    return hasHttp ? url : `http://${url}`;
};

router.post('/jobs', (req, res, next) => {
    const url = normalizeUrl(req.body.url);

    if (!validUrl.isUri(url)) {
	return res.sendStatus(400);
    }

    const job = new Job({ url });
    const { id: jobId } = job;

    job.save((err, job) => {
	if (err) {
	    console.log(`Unable to create job record for "${url}".  Error: ${err}`);
	    return res.sendStatus(500);
	}

	queue.create('fetchUrl', {
	    id: jobId,
	    url,
	}).save();

	res.send({ jobId, status: job.status });
    });
});

router.get('/jobs/:jobId', (req, res, next) => {
    const { jobId } = req.params;
    
    Job.findById(jobId, (err, job) => {
	if (err) {
	    return res.sendStatus(404);
	}

	const response = {
	    status: job.status
	};

	if (job.status === 'done') {
	    response.html = job.response
	}
	
	res.send(response);
    });
});

module.exports = router;
