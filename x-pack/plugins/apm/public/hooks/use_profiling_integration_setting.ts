/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useUiSetting } from '@kbn/kibana-react-plugin/public';
import { apmEnableProfilingIntegration } from '@kbn/observability-plugin/common';
import { ApmFeatureFlagName } from '../../common/apm_feature_flags';
import { useApmFeatureFlag } from './use_apm_feature_flag';

export function useProfilingIntegrationSetting() {
  const isProfilingIntegrationFeatureFlagEnabled = useApmFeatureFlag(
    ApmFeatureFlagName.ProfilingIntegrationAvailable
  );
  const isProfilingIntegrationUiSettingEnabled = useUiSetting<boolean>(
    apmEnableProfilingIntegration
  );

  return (
    isProfilingIntegrationFeatureFlagEnabled &&
    isProfilingIntegrationUiSettingEnabled
  );
}
