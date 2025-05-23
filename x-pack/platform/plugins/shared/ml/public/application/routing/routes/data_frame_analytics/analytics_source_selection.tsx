/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC } from 'react';
import React from 'react';
import { i18n } from '@kbn/i18n';
import { dynamic } from '@kbn/shared-ux-utility';
import { ML_PAGES } from '../../../../locator';
import type { MlRoute } from '../../router';
import { createPath, PageLoader } from '../../router';
import { useRouteResolver } from '../../use_resolver';
import { basicResolvers } from '../../resolvers';
import {
  type NavigateToApp,
  getMlManagementBreadcrumb,
  getStackManagementBreadcrumb,
} from '../../breadcrumbs';

const Page = dynamic(async () => ({
  default: (await import('../../../data_frame_analytics/pages/source_selection')).Page,
}));

export const analyticsSourceSelectionRouteFactory = (navigateToApp: NavigateToApp): MlRoute => ({
  path: createPath(ML_PAGES.DATA_FRAME_ANALYTICS_SOURCE_SELECTION),
  render: () => <PageWrapper />,
  title: i18n.translate('xpack.ml.dataFrameAnalytics.sourceSelection.docTitle', {
    defaultMessage: 'Source Selection',
  }),
  breadcrumbs: [
    getStackManagementBreadcrumb(navigateToApp),
    getMlManagementBreadcrumb('DATA_FRAME_ANALYTICS_MANAGEMENT_BREADCRUMB', navigateToApp),
    {
      text: i18n.translate('xpack.ml.dataFrameAnalyticsBreadcrumbs.dataFrameSourceSelectionLabel', {
        defaultMessage: 'Source Selection',
      }),
    },
  ],
});

const PageWrapper: FC = () => {
  const { context } = useRouteResolver('full', ['canGetDataFrameAnalytics'], basicResolvers());

  return (
    <PageLoader context={context}>
      <Page />
    </PageLoader>
  );
};
