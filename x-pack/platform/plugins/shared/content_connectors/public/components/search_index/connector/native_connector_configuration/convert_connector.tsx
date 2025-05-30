/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { useActions, useValues } from 'kea';

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiSpacer,
  EuiText,
  EuiLink,
  EuiButton,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { useKibana } from '@kbn/kibana-react-plugin/public';
import { ConvertConnectorModal } from '../../../shared/convert_connector_modal/convert_connector_modal';

import { ConvertConnectorLogic } from './convert_connector_logic';
import { docLinks } from '../../../shared/doc_links';

export const ConvertConnector: React.FC = () => {
  const {
    services: { http },
  } = useKibana();
  const { showModal } = useActions(ConvertConnectorLogic({ http }));
  const { isModalVisible } = useValues(ConvertConnectorLogic({ http }));

  return (
    <>
      {isModalVisible && <ConvertConnectorModal />}
      <EuiFlexGroup direction="row" alignItems="center" gutterSize="s">
        <EuiFlexItem>
          <EuiTitle size="s">
            <h3>
              {i18n.translate(
                'xpack.contentConnectors.content.indices.configurationConnector.nativeConnector.convertConnector.title',
                {
                  defaultMessage: 'Self-manage this connector',
                }
              )}
            </h3>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="l" />
      <EuiText size="s">
        <FormattedMessage
          id="xpack.contentConnectors.content.indices.configurationConnector.nativeConnector.convertConnector.description"
          defaultMessage="Want to self-host this connector? Convert it to a {link}, to be managed on your own infrastructure. You'll need to convert this connector if you want to customize the code using our Python framework."
          values={{
            link: (
              <EuiLink
                data-test-subj="enterpriseSearchConvertConnectorSelfManagedConnectorLink"
                href={docLinks.buildConnector}
                target="_blank"
              >
                {i18n.translate(
                  'xpack.contentConnectors.content.indices.configurationConnector.nativeConnector.convertConnector.linkTitle',
                  { defaultMessage: 'self-managed connector' }
                )}
              </EuiLink>
            ),
          }}
        />
        <EuiSpacer size="l" />
        <EuiButton
          data-test-subj="enterpriseSearchConvertConnectorConvertConnectorButton"
          onClick={() => showModal()}
        >
          {i18n.translate(
            'xpack.contentConnectors.content.indices.configurationConnector.nativeConnector.convertConnector.buttonTitle',
            { defaultMessage: 'Convert connector' }
          )}
        </EuiButton>
      </EuiText>
    </>
  );
};
