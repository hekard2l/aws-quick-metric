'use strict';

const chai = require('chai');
const { assert } = chai;
chai.use(require('chai-as-promised'));

const sinon = require('sinon');
const { CustomMetric } = require('../');

describe('CustomMetric', function() {
  const namespace = 'MyCustomProject';
  const metric = 'MyCustomMetric';

  let sandbox, aws, customMetric, cloudWatchMock;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    aws = {
      CloudWatch: function() {
        const cloudWatch = {
          putMetricData: _ => _
        };
        cloudWatchMock = sandbox.mock(cloudWatch);
        return cloudWatch;
      }
    };

    customMetric = new CustomMetric(aws, namespace);
  });

  afterEach(function() {
    sandbox.verifyAndRestore();
  });

  describe('#stat(...)', function() {
    describe('flush', function() {
      it('should call putMetricData with the correct arguments', function() {
        const value = 0.0;
        const unit = 'None';
        cloudWatchMock.expects('putMetricData')
          .withExactArgs({
            MetricData: [{
              MetricName: metric,
              Unit: unit,
              Value: value,
              Dimensions: []
            }, {
              MetricName: metric,
              Unit: unit,
              Value: value,
              Dimensions: []
            }, {
              MetricName: metric,
              Unit: unit,
              Value: value,
              Dimensions: []
            }],
            Namespace: namespace
          })
          .returns({
            promise: () => Promise.resolve()
          })
          .once();

        customMetric.stat({
          metric,
          value,
          unit,
        });

        customMetric.stat({
          metric,
          value,
          unit,
        });

        customMetric.stat({
          metric,
          value,
          unit,
        });

        return customMetric.flush();
      });

      it('should not putMetric, because queue was not flushed', function() {
        cloudWatchMock.expects('putMetricData')
          .never();

        const disabledCustomMetric = new CustomMetric(aws, namespace, {
          disabled: true
        });

        return disabledCustomMetric.stat({});
      });
    });

    describe('immediate', function() {
      it('should call putMetricData with the correct arguments', function() {
        const value = 0.0;
        const unit = 'None';
        cloudWatchMock.expects('putMetricData')
          .withExactArgs({
            MetricData: [{
              MetricName: metric,
              Unit: unit,
              Value: value,
              Dimensions: []
            }],
            Namespace: namespace
          })
          .returns({
            promise: () => Promise.resolve()
          })
          .once();

        return customMetric.stat({
          metric,
          value,
          unit,
          immediate: true
        });
      });

      it('should fail due to putMetricData error', function() {
        cloudWatchMock.expects('putMetricData')
          .returns({
            promise: () => Promise.reject(new Error(''))
          })
          .once();

        assert.isRejected(customMetric.stat({
          metric,
          value: 0.0,
          unit: 'None',
          immediate: true
        }));
      });

      it('should throw due to missing value', function() {
        cloudWatchMock.expects('putMetricData')
          .never();

        assert.throws(() => customMetric.stat({
          metric,
          immediate: true
        }));
      });

      it('should throw due to missing metric', function() {
        cloudWatchMock.expects('putMetricData')
          .never();

        assert.throws(() => customMetric.stat({
          value: 0.0,
          immediate: true
        }));
      });

      it('should do not nothing when disabled', function() {
        cloudWatchMock.expects('putMetricData')
          .never();

        const disabledCustomMetric = new CustomMetric(aws, namespace, {
          disabled: true
        });

        return disabledCustomMetric.stat({
          immediate: true
        });
      });
    });
  });
});
