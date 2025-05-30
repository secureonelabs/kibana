/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC } from 'react';
import React from 'react';
import { Chart, Settings, TooltipType, Tooltip } from '@elastic/charts';
import { i18n } from '@kbn/i18n';
import { useMlKibana } from '../../../../../../contexts/kibana';
import type { ModelItem, Anomaly } from '../../../../common/results_loader';
import { Anomalies } from '../common/anomalies';
import { ModelBounds } from './model_bounds';
import { Line } from './line';
import { Scatter } from './scatter';
import { Axes } from '../common/axes';
import { getXRange } from '../common/utils';
import type { LineChartPoint } from '../../../../common/chart_loader';
import { LoadingWrapper } from '../loading_wrapper';

export enum CHART_TYPE {
  LINE,
  SCATTER,
}

interface Props {
  chartType: CHART_TYPE;
  chartData: LineChartPoint[];
  modelData: ModelItem[];
  anomalyData: Anomaly[];
  height: string;
  width: string;
  loading?: boolean;
}

export const AnomalyChart: FC<Props> = ({
  chartType,
  chartData = [],
  modelData,
  anomalyData,
  height,
  width,
  loading = false,
}) => {
  const {
    services: {
      charts: {
        theme: { useChartsBaseTheme },
      },
    },
  } = useMlKibana();

  const baseTheme = useChartsBaseTheme();

  const data = chartType === CHART_TYPE.SCATTER ? flattenData(chartData) : chartData;
  const xDomain = getXRange(data);
  return (
    <div style={{ width, height }} data-test-subj={`mlAnomalyChart ${CHART_TYPE[chartType]}`}>
      <LoadingWrapper height={height} hasData={data.length > 0} loading={loading}>
        <Chart>
          <Tooltip type={TooltipType.None} />
          <Settings baseTheme={baseTheme} xDomain={xDomain} locale={i18n.getLocale()} />
          <Axes chartData={data} />
          <Anomalies anomalyData={anomalyData} />
          <ModelBounds modelData={modelData} />
          {chartType === CHART_TYPE.LINE && <Line chartData={data} />}
          {chartType === CHART_TYPE.SCATTER && <Scatter chartData={data} />}
        </Chart>
      </LoadingWrapper>
    </div>
  );
};

function flattenData(data: any): LineChartPoint[] {
  const chartData = data.reduce((p: any[], c: any) => {
    p.push(...c.values.map((v: any) => ({ time: c.time, value: v.value })));
    return p;
  }, []);
  return chartData;
}
