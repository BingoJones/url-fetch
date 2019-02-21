const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const validUrl = require('valid-url');

mongoose.connect('mongodb://localhost/local', { useNewUrlParser: true });

const { Schema, model } = mongoose;

const JobSchema = new Schema({
    url: { type: String, required: true },
    status: { type: String, default: 'pending' },
    response: { type: String }
});

const Job = model('Job', JobSchema);

router.post('/jobs', (req, res, next) => {
    const { url } = req.body;

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

	res.send({ jobId, status: job.status });

	fetch(url)
	    .then(res => res.text())
	    .then(body => {
		job.update({ status: 'done', response: body }).exec();
	    })
	    .catch(err => {
		console.log(`Could not fetch contents of "${url}"`);
		job.update({ status: 'error' }).exec();
	    });
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
