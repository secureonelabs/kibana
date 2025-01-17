/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React, { FC, PropsWithChildren } from 'react';
import { reducer } from '../reducer';
import { Context } from '../redux';
import { initialState, State } from '../state';

interface TestProviderProps {
  state?: State;
}

export const TestProvider: FC<PropsWithChildren<TestProviderProps>> = ({
  children,
  state = initialState,
}) => {
  const store = configureStore({
    reducer,
    devTools: false,
    preloadedState: state,
    enhancers: [],
  });

  return (
    <ReduxProvider store={store} context={Context}>
      {children}
    </ReduxProvider>
  );
};
