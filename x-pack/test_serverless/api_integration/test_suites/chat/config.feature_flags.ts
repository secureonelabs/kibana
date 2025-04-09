/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createTestConfig } from '../../config.base';

/**
 * Make sure to create a MKI deployment with custom Kibana image, that includes feature flags arguments
 * These tests most likely will fail on default MKI project
 */
export default createTestConfig({
  serverlessProject: 'chat',
  junit: {
    reportName: 'Serverless Chat Feature Flags API Integration Tests',
  },
  suiteTags: { exclude: ['skipSvlChat'] },
  // add feature flags
  kbnServerArgs: [
    // e.g. `--xpack.searchIndices.enabled=true`, // global empty state FF
  ],
  // load tests in the index file
  testFiles: [require.resolve('./index.feature_flags.ts')],

  // include settings from project controller
  esServerArgs: [],
});
