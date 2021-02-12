/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// @ts-ignore
import { checkParam } from '../../error_missing_required';
// @ts-ignore
import { createQuery } from '../../create_query';
// @ts-ignore
import { ElasticsearchMetric } from '../../metrics';
import { ElasticsearchResponse, ElasticsearchLegacySource } from '../../../../common/types/es';
import { LegacyRequest } from '../../../types';

export function handleResponse(response: ElasticsearchResponse) {
  const hits = response.hits?.hits;
  if (!hits) {
    return [];
  }

  // deduplicate any shards from earlier days with the same cluster state state_uuid
  const uniqueShards = new Set<string>();

  // map into object with shard and source propertiesd
  return hits.reduce((shards: Array<ElasticsearchLegacySource['shard']>, hit) => {
    const shard = hit._source.shard ?? hit._source.elasticsearch;

    if (shard) {
      const index = shard.index?.name ?? shard.index;
      const shardNumber = shard.shard?.number ?? shard.shard;
      const primary = shard.shard?.primary ?? shard.primary;
      const relocatingNode = shard.shard?.relocating_node?.uuid ?? shard.relocating_node;
      const node = shard.node?.name ?? shard.node;
      // note: if the request is for a node, then it's enough to deduplicate without primary, but for indices it displays both
      const shardId = `${index}-${shardNumber}-${primary}-${relocatingNode}-${node}`;

      if (!uniqueShards.has(shardId)) {
        shards.push(shard);
        uniqueShards.add(shardId);
      }
    }

    return shards;
  }, []);
}

export function getShardAllocation(
  req: LegacyRequest,
  esIndexPattern: string,
  {
    shardFilter,
    stateUuid,
    showSystemIndices = false,
  }: { shardFilter: any; stateUuid: string; showSystemIndices: boolean }
) {
  checkParam(esIndexPattern, 'esIndexPattern in elasticsearch/getShardAllocation');

  const filters = [
    {
      bool: {
        should: [
          {
            term: {
              state_uuid: stateUuid,
            },
          },
          {
            term: {
              'elasticsearch.cluster.stats.state.state_uuid': stateUuid,
            },
          },
        ],
      },
    },
    shardFilter,
  ];

  if (!showSystemIndices) {
    filters.push({
      bool: {
        must_not: [
          { prefix: { 'shard.index': '.' } },
          { prefix: { 'elasticsearch.index.name': '.' } },
        ],
      },
    });
  }

  const config = req.server.config();
  const clusterUuid = req.params.clusterUuid;
  const metric = ElasticsearchMetric.getMetricFields();
  const params = {
    index: esIndexPattern,
    size: config.get('monitoring.ui.max_bucket_size'),
    ignoreUnavailable: true,
    body: {
      query: createQuery({ types: ['shard', 'shards'], clusterUuid, metric, filters }),
    },
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params).then(handleResponse);
}
