const workerTestSubmissionService = require('../services/workerTestSubmissionService');

const submitWorkerTest = async (req, res, next) => {
  try {
    const submission = await workerTestSubmissionService.submitWorkerTest(req.user.id, req.body);

    res.status(201).json({
      message: 'ワーカーテスト回答を受け付けました',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

const getMyLatestSubmission = async (req, res, next) => {
  try {
    const submission = await workerTestSubmissionService.getLatestSubmissionForWorker(req.user.id);

    res.json({
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyLatestSubmission,
  submitWorkerTest
};
