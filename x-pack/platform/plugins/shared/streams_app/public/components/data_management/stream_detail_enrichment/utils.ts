/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* eslint-disable @typescript-eslint/naming-convention */

import {
  ProcessorDefinition,
  ProcessorDefinitionWithId,
  ProcessorType,
  getProcessorType,
} from '@kbn/streams-schema';
import { htmlIdGenerator } from '@elastic/eui';
import { isEmpty, mapValues } from 'lodash';
import {
  DissectFormState,
  ProcessorDefinitionWithUIAttributes,
  GrokFormState,
  ProcessorFormState,
  WithUIAttributes,
  DateFormState,
} from './types';
import { ALWAYS_CONDITION } from '../../../util/condition';
import { configDrivenProcessors } from './processors/config_driven';
import {
  ConfigDrivenProcessorType,
  ConfigDrivenProcessors,
} from './processors/config_driven/types';

/**
 * These are processor types with specialised UI. Other processor types are handled by a generic config-driven UI.
 */
export const SPECIALISED_TYPES = ['date', 'dissect', 'grok'];

const defaultDateProcessorFormState: DateFormState = {
  type: 'date',
  field: '',
  formats: [],
  locale: '',
  target_field: '',
  timezone: '',
  output_format: '',
  ignore_failure: true,
  if: ALWAYS_CONDITION,
};

const defaultDissectProcessorFormState: DissectFormState = {
  type: 'dissect',
  field: 'message',
  pattern: '',
  ignore_failure: true,
  ignore_missing: true,
  if: ALWAYS_CONDITION,
};

const defaultGrokProcessorFormState: GrokFormState = {
  type: 'grok',
  field: 'message',
  patterns: [{ value: '' }],
  pattern_definitions: {},
  ignore_failure: true,
  ignore_missing: true,
  if: ALWAYS_CONDITION,
};

const configDrivenDefaultFormStates = mapValues(
  configDrivenProcessors,
  (config) => config.defaultFormState
) as {
  [TKey in ConfigDrivenProcessorType]: ConfigDrivenProcessors[TKey]['defaultFormState'];
};

const defaultProcessorFormStateByType: Record<ProcessorType, ProcessorFormState> = {
  date: defaultDateProcessorFormState,
  dissect: defaultDissectProcessorFormState,
  grok: defaultGrokProcessorFormState,
  ...configDrivenDefaultFormStates,
};

export const getDefaultFormStateByType = (type: ProcessorType) =>
  defaultProcessorFormStateByType[type];

export const getFormStateFrom = (
  processor?: ProcessorDefinitionWithUIAttributes
): ProcessorFormState => {
  if (!processor) return defaultGrokProcessorFormState;

  if (isGrokProcessor(processor)) {
    const { grok } = processor;

    return structuredClone({
      ...grok,
      type: 'grok',
      patterns: grok.patterns.map((pattern) => ({ value: pattern })),
    });
  }

  if (isDissectProcessor(processor)) {
    const { dissect } = processor;

    return structuredClone({
      ...dissect,
      type: 'dissect',
    });
  }

  if (isDateProcessor(processor)) {
    const { date } = processor;

    return structuredClone({
      ...date,
      type: 'date',
    });
  }

  if (processor.type in configDrivenProcessors) {
    return configDrivenProcessors[
      processor.type as ConfigDrivenProcessorType
    ].convertProcessorToFormState(processor as any);
  }

  throw new Error(`Form state for processor type "${processor.type}" is not implemented.`);
};

export const convertFormStateToProcessor = (formState: ProcessorFormState): ProcessorDefinition => {
  if (formState.type === 'grok') {
    const { patterns, field, pattern_definitions, ignore_failure, ignore_missing } = formState;

    return {
      grok: {
        if: formState.if,
        patterns: patterns.filter(({ value }) => value.trim().length > 0).map(({ value }) => value),
        field,
        pattern_definitions,
        ignore_failure,
        ignore_missing,
      },
    };
  }

  if (formState.type === 'dissect') {
    const { field, pattern, append_separator, ignore_failure, ignore_missing } = formState;

    return {
      dissect: {
        if: formState.if,
        field,
        pattern,
        append_separator: isEmpty(append_separator) ? undefined : append_separator,
        ignore_failure,
        ignore_missing,
      },
    };
  }

  if (formState.type === 'date') {
    const { field, formats, locale, ignore_failure, target_field, timezone, output_format } =
      formState;

    return {
      date: {
        if: formState.if,
        field,
        formats,
        ignore_failure,
        locale: isEmpty(locale) ? undefined : locale,
        target_field: isEmpty(target_field) ? undefined : target_field,
        timezone: isEmpty(timezone) ? undefined : timezone,
        output_format: isEmpty(output_format) ? undefined : output_format,
      },
    };
  }

  if (configDrivenProcessors[formState.type]) {
    return configDrivenProcessors[formState.type].convertFormStateToConfig(formState as any);
  }

  throw new Error('Cannot convert form state to processing: unknown type.');
};

const createProcessorGuardByType =
  <TProcessorType extends ProcessorType>(type: TProcessorType) =>
  (
    processor: ProcessorDefinitionWithUIAttributes
  ): processor is WithUIAttributes<
    Extract<ProcessorDefinition, { [K in TProcessorType]: unknown }>
  > =>
    processor.type === type;

export const isDateProcessor = createProcessorGuardByType('date');
export const isDissectProcessor = createProcessorGuardByType('dissect');
export const isGrokProcessor = createProcessorGuardByType('grok');

const createId = htmlIdGenerator();
const toUIDefinition = <TProcessorDefinition extends ProcessorDefinition>(
  processor: TProcessorDefinition
): ProcessorDefinitionWithUIAttributes => ({
  id: createId(),
  type: getProcessorType(processor),
  ...processor,
});

const toAPIDefinition = (processor: ProcessorDefinitionWithUIAttributes): ProcessorDefinition => {
  const { id, type, ...processorConfig } = processor;
  return processorConfig;
};

const toSimulateDefinition = (
  processor: ProcessorDefinitionWithUIAttributes
): ProcessorDefinitionWithId => {
  const { type, ...processorConfig } = processor;
  return processorConfig;
};

export const processorConverter = {
  toAPIDefinition,
  toSimulateDefinition,
  toUIDefinition,
};
