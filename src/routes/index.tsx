import React from 'react';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

import RoomPage from 'src/pages/room-page';
import ErrorPage from 'src/pages/error-page';

const Router: React.FC = () => (
  <BrowserRouter>
    <Switch>
      <Route path="/" exact component={RoomPage} />
      <Route path="/error" exact component={ErrorPage} />
    </Switch>
  </BrowserRouter>
);

export default Router;
