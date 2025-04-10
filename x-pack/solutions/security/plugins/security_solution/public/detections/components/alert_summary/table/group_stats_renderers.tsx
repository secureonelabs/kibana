/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiSkeletonText } from '@elastic/eui';
import type { GroupStatsItem, RawBucket } from '@kbn/grouping';
import React, { memo } from 'react';
import { i18n } from '@kbn/i18n';
import type { GenericBuckets } from '@kbn/grouping/src';
import { CardIcon } from '@kbn/fleet-plugin/public';
import { useGetIntegrationFromRuleId } from '../../../hooks/alert_summary/use_get_integration_from_rule_id';
import { getRulesBadge, getSeverityComponent } from '../../alerts_table/grouping_settings';
import { DEFAULT_GROUP_STATS_RENDERER } from '../../alerts_table/alerts_grouping';
import type { AlertsGroupingAggregation } from '../../alerts_table/grouping_settings/types';

const STATS_GROUP_SIGNAL_RULE_ID = i18n.translate(
  'xpack.securitySolution.alertSummary.groups.integrations',
  {
    defaultMessage: 'Integrations:',
  }
);
const STATS_GROUP_SIGNAL_RULE_ID_MULTI = i18n.translate(
  'xpack.securitySolution.alertSummary.groups.integrations.multi',
  {
    defaultMessage: ' Multi',
  }
);

export const INTEGRATION_ICON_TEST_ID = 'alert-summary-table-integration-cell-renderer-icon';
export const INTEGRATION_LOADING_TEST_ID = 'alert-summary-table-integration-cell-renderer-loading';

interface IntegrationProps {
  /**
   * Aggregation buckets for integrations
   */
  signalRuleIdBucket: GenericBuckets;
}

/**
 * Renders the icon for the integration that matches the rule id.
 * In AI for SOC, we can retrieve the integration/package that matches a specific rule, via the related_integrations field on the rule.
 */
export const Integration = memo(({ signalRuleIdBucket }: IntegrationProps) => {
  const signalRuleId = signalRuleIdBucket.key;
  const { integration, isLoading } = useGetIntegrationFromRuleId({ ruleId: signalRuleId });

  return (
    <EuiSkeletonText data-test-subj={INTEGRATION_LOADING_TEST_ID} isLoading={isLoading} lines={1}>
      {integration ? (
        <CardIcon
          data-test-subj={INTEGRATION_ICON_TEST_ID}
          icons={integration.icons}
          integrationName={integration.title}
          packageName={integration.name}
          size="s"
          version={integration.version}
        />
      ) : null}
    </EuiSkeletonText>
  );
});
Integration.displayName = 'Integration';

/**
 * Return a renderer for integration aggregation.
 */
export const getIntegrationComponent = (
  bucket: RawBucket<AlertsGroupingAggregation>
): GroupStatsItem[] => {
  const signalRuleIds = bucket.signalRuleIdSubAggregation?.buckets;

  if (!signalRuleIds || signalRuleIds.length === 0) {
    return [];
  }

  if (signalRuleIds.length === 1) {
    return [
      {
        title: STATS_GROUP_SIGNAL_RULE_ID,
        component: <Integration signalRuleIdBucket={signalRuleIds[0]} />,
      },
    ];
  }

  return [
    {
      title: STATS_GROUP_SIGNAL_RULE_ID,
      component: <>{STATS_GROUP_SIGNAL_RULE_ID_MULTI}</>,
    },
  ];
};

/**
 * Returns stats to be used in the`extraAction` property of the EuiAccordion component used within the kbn-grouping package.
 * It handles custom renders for the following fields:
 * - signal.rule.id
 * - kibana.alert.severity
 * - kibana.alert.rule.name
 * And returns a default view for all the other fields.
 *
 * These go hand in hand with groupingOptions, groupTitleRenderers and groupStatsAggregations.
 */
export const groupStatsRenderer = (
  selectedGroup: string,
  bucket: RawBucket<AlertsGroupingAggregation>
): GroupStatsItem[] => {
  const defaultBadges: GroupStatsItem[] = DEFAULT_GROUP_STATS_RENDERER(selectedGroup, bucket);
  const severityComponent: GroupStatsItem[] = getSeverityComponent(bucket);
  const integrationComponent: GroupStatsItem[] = getIntegrationComponent(bucket);
  const rulesBadge: GroupStatsItem = getRulesBadge(bucket);

  switch (selectedGroup) {
    case 'signal.rule.id':
      return [...severityComponent, rulesBadge, ...defaultBadges];
    case 'kibana.alert.severity':
      return [...integrationComponent, rulesBadge, ...defaultBadges];
    case 'kibana.alert.rule.name':
      return [...integrationComponent, ...severityComponent, ...defaultBadges];
    default:
      return [...integrationComponent, ...severityComponent, rulesBadge, ...defaultBadges];
  }
};
