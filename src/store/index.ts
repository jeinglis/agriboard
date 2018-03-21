import Vuex from 'vuex';
import Vue from 'vue';

import app from './modules/app';
import toolbar from './modules/toolbar';
import drawer from './modules/drawer';
import farmer from './modules/farmer';
import milk from './modules/milk';
import loan from './modules/loan';
import delivery from './modules/delivery';
import { RootState } from '@/store/types';

Vue.use(Vuex);

/**
 * The Vuex store
 */
const store = new Vuex.Store<RootState>({
  modules: {
    app,
    toolbar,
    drawer,
    farmer,
    milk,
    loan,
    delivery,
  },
});

if (module.hot) {
  // accept actions and mutations as hot modules
  module.hot.accept(['./modules/app'], () => {
    // require the updated modules
    // have to add .default here due to babel 6 module output
    const appModule = require('./modules/app').default;
    const toolbarModule = require('./modules/toolbar').default;
    const drawerModule = require('./modules/drawer').default;
    const farmerModule = require('./modules/farmer').default;
    const milkModule = require('./modules/milk').default;
    const loanModule = require('./modules/loan').default;
    const deliveryModule = require('./modules/delivery').default;
    // swap in the new actions and mutations
    store.hotUpdate({
      modules: {
        app: appModule,
        toolbar: toolbarModule,
        drawer: drawerModule,
        farmer: farmerModule,
        milk: milkModule,
        loan: loanModule,
        delivery: deliveryModule,
      },
    });
  });
}

export default store;
