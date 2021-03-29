/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
// import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { isEmpty } from 'lodash/fp';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingContent,
  EuiLoadingSpinner,
  EuiHorizontalRule,
} from '@elastic/eui';

import { CaseStatuses, CaseAttributes, CaseType } from '../../../common';
import { Case, CaseConnector } from '../../containers/types';
import { HeaderPage } from '../header_page';
import { EditableTitle } from '../header_page/editable_title';
import { TagList } from '../tag_list';
import { useGetCase } from '../../containers/use_get_case';
import { UserActionTree } from '../user_action_tree';
import { UserList } from '../user_list';
import { useUpdateCase } from '../../containers/use_update_case';
import { getTypedPayload } from '../../containers/utils';
import { WhitePageWrapper, HeaderWrapper } from '../wrappers';
import { CaseActionBar } from '../case_action_bar';
import { useGetCaseUserActions } from '../../containers/use_get_case_user_actions';
import { usePushToService } from '../use_push_to_service';
import { EditConnector } from '../edit_connector';
import { useConnectors } from '../../containers/configure/use_connectors';
import {
  getConnectorById,
  normalizeActionConnector,
  getNoneConnector,
} from '../configure_cases/utils';
import { StatusActionButton } from '../status/button';
import * as i18n from './translations';
import { Ecs } from '../../common/ecs_types';

// TODO: All below imports depend on Timeline or SecuritySolution in some form or another
// import { SpyRoute } from '../../../common/utils/route/spy_routes';

const gutterTimeline = '70px'; // seems to be a timeline reference from the original file
export interface CaseViewProps {
  allCasesHref: string;
  backToAllCasesOnClick: (ev: MouseEvent) => void;
  caseDetailsHref: string;
  caseId: string;
  configureCasesHref: string;
  getCaseDetailHrefWithCommentId: (commentId: string) => string;
  getRuleDetailsHref: (ruleId: string | null | undefined) => string;
  onComponentInitialized?: () => void;
  onConfigureCasesNavClick: (ev: React.MouseEvent) => void;
  onRuleDetailsClick: (ruleId: string | null | undefined) => void;
  renderInvestigateInTimelineActionComponent?: (alertIds: string[]) => JSX.Element;
  renderTimelineDetailsPanel?: () => JSX.Element;
  showAlertDetails: (alertId: string, index: string) => void;
  subCaseId?: string;
  useFetchAlertData: (alertIds: string[]) => [boolean, Record<string, Ecs>];
  userCanCrud: boolean;
}

export interface OnUpdateFields {
  key: keyof Case;
  value: Case[keyof Case];
  onSuccess?: () => void;
  onError?: () => void;
}

const MyWrapper = styled.div`
  padding: ${({ theme }) =>
    `${theme.eui.paddingSizes.l} ${theme.eui.paddingSizes.l} ${gutterTimeline} ${theme.eui.paddingSizes.l}`};
`;

const MyEuiFlexGroup = styled(EuiFlexGroup)`
  height: 100%;
`;

const MyEuiHorizontalRule = styled(EuiHorizontalRule)`
  margin-left: 48px;
  &.euiHorizontalRule--full {
    width: calc(100% - 48px);
  }
`;

export interface CaseComponentProps extends CaseViewProps {
  fetchCase: () => void;
  caseData: Case;
  updateCase: (newCase: Case) => void;
}

export const CaseComponent = React.memo<CaseComponentProps>(
  ({
    allCasesHref,
    backToAllCasesOnClick,
    caseData,
    caseDetailsHref,
    caseId,
    configureCasesHref,
    fetchCase,
    getCaseDetailHrefWithCommentId,
    getRuleDetailsHref,
    onComponentInitialized,
    onConfigureCasesNavClick,
    onRuleDetailsClick,
    renderInvestigateInTimelineActionComponent,
    renderTimelineDetailsPanel,
    showAlertDetails,
    subCaseId,
    updateCase,
    useFetchAlertData,
    userCanCrud,
  }) => {
    const [initLoadingData, setInitLoadingData] = useState(true);
    const init = useRef(true);

    const {
      caseUserActions,
      fetchCaseUserActions,
      caseServices,
      hasDataToPush,
      isLoading: isLoadingUserActions,
      participants,
    } = useGetCaseUserActions(caseId, caseData.connector.id, subCaseId);

    const { isLoading, updateKey, updateCaseProperty } = useUpdateCase({
      caseId,
      subCaseId,
    });

    // Update Fields
    const onUpdateField = useCallback(
      ({ key, value, onSuccess, onError }: OnUpdateFields) => {
        const handleUpdateNewCase = (newCase: Case) =>
          updateCase({ ...newCase, comments: caseData.comments });
        switch (key) {
          case 'title':
            const titleUpdate = getTypedPayload<string>(value);
            if (titleUpdate.length > 0) {
              updateCaseProperty({
                fetchCaseUserActions,
                updateKey: 'title',
                updateValue: titleUpdate,
                updateCase: handleUpdateNewCase,
                caseData,
                onSuccess,
                onError,
              });
            }
            break;
          case 'connector':
            const connector = getTypedPayload<CaseConnector>(value);
            if (connector != null) {
              updateCaseProperty({
                fetchCaseUserActions,
                updateKey: 'connector',
                updateValue: connector,
                updateCase: handleUpdateNewCase,
                caseData,
                onSuccess,
                onError,
              });
            }
            break;
          case 'description':
            const descriptionUpdate = getTypedPayload<string>(value);
            if (descriptionUpdate.length > 0) {
              updateCaseProperty({
                fetchCaseUserActions,
                updateKey: 'description',
                updateValue: descriptionUpdate,
                updateCase: handleUpdateNewCase,
                caseData,
                onSuccess,
                onError,
              });
            }
            break;
          case 'tags':
            const tagsUpdate = getTypedPayload<string[]>(value);
            updateCaseProperty({
              fetchCaseUserActions,
              updateKey: 'tags',
              updateValue: tagsUpdate,
              updateCase: handleUpdateNewCase,
              caseData,
              onSuccess,
              onError,
            });
            break;
          case 'status':
            const statusUpdate = getTypedPayload<CaseStatuses>(value);
            if (caseData.status !== value) {
              updateCaseProperty({
                fetchCaseUserActions,
                updateKey: 'status',
                updateValue: statusUpdate,
                updateCase: handleUpdateNewCase,
                caseData,
                onSuccess,
                onError,
              });
            }
            break;
          case 'settings':
            const settingsUpdate = getTypedPayload<CaseAttributes['settings']>(value);
            if (caseData.settings !== value) {
              updateCaseProperty({
                fetchCaseUserActions,
                updateKey: 'settings',
                updateValue: settingsUpdate,
                updateCase: handleUpdateNewCase,
                caseData,
                onSuccess,
                onError,
              });
            }
            break;
          default:
            return null;
        }
      },
      [fetchCaseUserActions, updateCaseProperty, updateCase, caseData]
    );

    const handleUpdateCase = useCallback(
      (newCase: Case) => {
        updateCase(newCase);
        fetchCaseUserActions(caseId, newCase.connector.id, subCaseId);
      },
      [updateCase, fetchCaseUserActions, caseId, subCaseId]
    );

    const { loading: isLoadingConnectors, connectors } = useConnectors();

    const [connectorName, isValidConnector] = useMemo(() => {
      const connector = connectors.find((c) => c.id === caseData.connector.id);
      return [connector?.name ?? '', !!connector];
    }, [connectors, caseData.connector]);

    const currentExternalIncident = useMemo(
      () =>
        caseServices != null && caseServices[caseData.connector.id] != null
          ? caseServices[caseData.connector.id]
          : null,
      [caseServices, caseData.connector]
    );

    const { pushButton, pushCallouts } = usePushToService({
      configureCasesHref,
      connector: {
        ...caseData.connector,
        name: isEmpty(connectorName) ? caseData.connector.name : connectorName,
      },
      caseServices,
      caseId: caseData.id,
      caseStatus: caseData.status,
      connectors,
      onConfigureCasesNavClick,
      updateCase: handleUpdateCase,
      userCanCrud,
      isValidConnector: isLoadingConnectors ? true : isValidConnector,
    });

    const onSubmitConnector = useCallback(
      (connectorId, connectorFields, onError, onSuccess) => {
        const connector = getConnectorById(connectorId, connectors);
        const connectorToUpdate = connector
          ? normalizeActionConnector(connector)
          : getNoneConnector();

        onUpdateField({
          key: 'connector',
          value: { ...connectorToUpdate, fields: connectorFields },
          onSuccess,
          onError,
        });
      },
      [onUpdateField, connectors]
    );

    const onSubmitTags = useCallback((newTags) => onUpdateField({ key: 'tags', value: newTags }), [
      onUpdateField,
    ]);

    const onSubmitTitle = useCallback(
      (newTitle) => onUpdateField({ key: 'title', value: newTitle }),
      [onUpdateField]
    );

    const changeStatus = useCallback(
      (status: CaseStatuses) =>
        onUpdateField({
          key: 'status',
          value: status,
        }),
      [onUpdateField]
    );

    const handleRefresh = useCallback(() => {
      fetchCaseUserActions(caseId, caseData.connector.id, subCaseId);
      fetchCase();
    }, [caseData.connector.id, caseId, fetchCase, fetchCaseUserActions, subCaseId]);

    // TODO: Handle spyRoute (pass as a prop or allow component to have children??)
    // const spyState = useMemo(() => ({ caseTitle: caseData.title }), [caseData.title]);

    const emailContent = useMemo(
      () => ({
        subject: i18n.EMAIL_SUBJECT(caseData.title),
        body: i18n.EMAIL_BODY(caseDetailsHref),
      }),
      [caseDetailsHref, caseData.title]
    );

    useEffect(() => {
      if (initLoadingData && !isLoadingUserActions) {
        setInitLoadingData(false);
      }
    }, [initLoadingData, isLoadingUserActions]);

    const backOptions = useMemo(
      () => ({
        href: allCasesHref,
        text: i18n.BACK_TO_ALL,
        dataTestSubj: 'backToCases',
        onClick: backToAllCasesOnClick,
      }),
      [allCasesHref, backToAllCasesOnClick]
    );

    const onShowAlertDetails = useCallback(
      (alertId: string, index: string) => {
        showAlertDetails(alertId, index);
      },
      [showAlertDetails]
    );

    // useEffect used for component's initialization
    useEffect(() => {
      if (init.current) {
        init.current = false;
        if (onComponentInitialized) {
          onComponentInitialized();
        }
      }
    }, [onComponentInitialized]);

    return (
      <>
        <HeaderWrapper>
          <HeaderPage
            backOptions={backOptions}
            data-test-subj="case-view-title"
            titleNode={
              <EditableTitle
                disabled={!userCanCrud}
                isLoading={isLoading && updateKey === 'title'}
                title={caseData.title}
                onSubmit={onSubmitTitle}
              />
            }
            title={caseData.title}
          >
            <CaseActionBar
              currentExternalIncident={currentExternalIncident}
              caseData={caseData}
              disabled={!userCanCrud}
              isLoading={isLoading && (updateKey === 'status' || updateKey === 'settings')}
              onRefresh={handleRefresh}
              onUpdateField={onUpdateField}
            />
          </HeaderPage>
        </HeaderWrapper>
        <WhitePageWrapper>
          <MyWrapper>
            {!initLoadingData && pushCallouts != null && pushCallouts}
            <EuiFlexGroup>
              <EuiFlexItem grow={6}>
                {initLoadingData && (
                  <EuiLoadingContent lines={8} data-test-subj="case-view-loading-content" />
                )}
                {!initLoadingData && (
                  <>
                    <UserActionTree
                      getCaseDetailHrefWithCommentId={getCaseDetailHrefWithCommentId}
                      getRuleDetailsHref={getRuleDetailsHref}
                      onRuleDetailsClick={onRuleDetailsClick}
                      caseServices={caseServices}
                      caseUserActions={caseUserActions}
                      connectors={connectors}
                      data={caseData}
                      fetchUserActions={fetchCaseUserActions.bind(
                        null,
                        caseId,
                        caseData.connector.id,
                        subCaseId
                      )}
                      isLoadingDescription={isLoading && updateKey === 'description'}
                      isLoadingUserActions={isLoadingUserActions}
                      onShowAlertDetails={onShowAlertDetails}
                      onUpdateField={onUpdateField}
                      renderInvestigateInTimelineActionComponent={
                        renderInvestigateInTimelineActionComponent
                      }
                      updateCase={updateCase}
                      useFetchAlertData={useFetchAlertData}
                      userCanCrud={userCanCrud}
                    />
                    {(caseData.type !== CaseType.collection || hasDataToPush) && (
                      <>
                        <MyEuiHorizontalRule
                          margin="s"
                          data-test-subj="case-view-bottom-actions-horizontal-rule"
                        />
                        <EuiFlexGroup alignItems="center" gutterSize="s" justifyContent="flexEnd">
                          {caseData.type !== CaseType.collection && (
                            <EuiFlexItem grow={false}>
                              <StatusActionButton
                                status={caseData.status}
                                onStatusChanged={changeStatus}
                                disabled={!userCanCrud}
                                isLoading={isLoading && updateKey === 'status'}
                              />
                            </EuiFlexItem>
                          )}
                          {hasDataToPush && (
                            <EuiFlexItem data-test-subj="has-data-to-push-button" grow={false}>
                              {pushButton}
                            </EuiFlexItem>
                          )}
                        </EuiFlexGroup>
                      </>
                    )}
                  </>
                )}
              </EuiFlexItem>
              <EuiFlexItem grow={2}>
                <UserList
                  data-test-subj="case-view-user-list-reporter"
                  email={emailContent}
                  headline={i18n.REPORTER}
                  users={[caseData.createdBy]}
                />
                <UserList
                  data-test-subj="case-view-user-list-participants"
                  email={emailContent}
                  headline={i18n.PARTICIPANTS}
                  loading={isLoadingUserActions}
                  users={participants}
                />
                <TagList
                  data-test-subj="case-view-tag-list"
                  disabled={!userCanCrud}
                  tags={caseData.tags}
                  onSubmit={onSubmitTags}
                  isLoading={isLoading && updateKey === 'tags'}
                />
                <EditConnector
                  caseFields={caseData.connector.fields}
                  connectors={connectors}
                  disabled={!userCanCrud}
                  hideConnectorServiceNowSir={
                    subCaseId != null || caseData.type === CaseType.collection
                  }
                  isLoading={isLoadingConnectors || (isLoading && updateKey === 'connector')}
                  onSubmit={onSubmitConnector}
                  selectedConnector={caseData.connector.id}
                  userActions={caseUserActions}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </MyWrapper>
        </WhitePageWrapper>
        {renderTimelineDetailsPanel ? renderTimelineDetailsPanel() : null}
        {/* TODO: Determine spyroute changes */}
        {/* <SpyRoute state={spyState} pageName={SecurityPageName.case} /> */}
      </>
    );
  }
);

export const CaseView = React.memo(
  ({
    allCasesHref,
    backToAllCasesOnClick,
    caseDetailsHref,
    caseId,
    configureCasesHref,
    getCaseDetailHrefWithCommentId,
    getRuleDetailsHref,
    onComponentInitialized,
    onConfigureCasesNavClick,
    onRuleDetailsClick,
    renderInvestigateInTimelineActionComponent,
    renderTimelineDetailsPanel,
    showAlertDetails,
    subCaseId,
    useFetchAlertData,
    userCanCrud,
  }: CaseViewProps) => {
    const { data, isLoading, isError, fetchCase, updateCase } = useGetCase(caseId, subCaseId);
    if (isError) {
      return null;
    }
    if (isLoading) {
      return (
        <MyEuiFlexGroup gutterSize="none" justifyContent="center" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner data-test-subj="case-view-loading" size="xl" />
          </EuiFlexItem>
        </MyEuiFlexGroup>
      );
    }

    return (
      data && (
        <CaseComponent
          allCasesHref={allCasesHref}
          backToAllCasesOnClick={backToAllCasesOnClick}
          caseData={data}
          caseDetailsHref={caseDetailsHref}
          caseId={caseId}
          configureCasesHref={configureCasesHref}
          fetchCase={fetchCase}
          getCaseDetailHrefWithCommentId={getCaseDetailHrefWithCommentId}
          getRuleDetailsHref={getRuleDetailsHref}
          onComponentInitialized={onComponentInitialized}
          onConfigureCasesNavClick={onConfigureCasesNavClick}
          onRuleDetailsClick={onRuleDetailsClick}
          renderInvestigateInTimelineActionComponent={renderInvestigateInTimelineActionComponent}
          renderTimelineDetailsPanel={renderTimelineDetailsPanel}
          showAlertDetails={showAlertDetails}
          subCaseId={subCaseId}
          updateCase={updateCase}
          useFetchAlertData={useFetchAlertData}
          userCanCrud={userCanCrud}
        />
      )
    );
  }
);

CaseComponent.displayName = 'CaseComponent';
CaseView.displayName = 'CaseView';

// eslint-disable-next-line import/no-default-export
export { CaseView as default };
