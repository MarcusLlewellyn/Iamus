//   Copyright 2020 Vircadia Contributors
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.

'use strict';

import { Router, RequestHandler, Request, Response, NextFunction } from 'express';
import { setupMetaverseAPI, finishMetaverseAPI } from '@Route-Tools/middleware';
import { accountFromAuthToken } from '@Route-Tools/middleware';

import { Tokens } from '@Entities/Tokens';
import { Scope } from '@Entities/Scope';
import { IsNullOrEmpty } from '@Tools/Misc';
import { Logger } from '@Tools/Logging';

// Request that creates a token for the passed account.
// Query parameter of 'scope' can say wether token is for 'owner' or 'domain'.
const procPostTokenNew: RequestHandler = async (req: Request, resp: Response, next: NextFunction) => {
  if (req.vAuthAccount) {

    // The user passes the scope but make sure we know it's one we know
    let scope = req.query.scope as string;
    if (IsNullOrEmpty(scope)) {
      scope = Scope.OWNER;
    };
    if (Scope.KnownScope(scope)) {
      const tokenInfo = await Tokens.createToken(req.vAuthAccount.accountId, scope);
      await Tokens.addToken(tokenInfo);
      req.vRestResp.Data = {
        'token': tokenInfo.token,
        'token_id': tokenInfo.tokenId,
        'refresh_token': tokenInfo.refreshToken,
        'token_expiration_seconds': (tokenInfo.tokenExpirationTime.valueOf() - tokenInfo.tokenCreationTime.valueOf()) / 1000,
        'account_name': req.vAuthAccount.username,
        'account_type': req.vAuthAccount.roles,
        'account_id': req.vAuthAccount.accountId
      };
    }
    else {
      req.vRestResp.respondFailure('incorrect scope');
    };
  }
  else {
    req.vRestResp.respondFailure('account not found');
  };
  next();
};

export const name = '/api/v1/token/new';

export const router = Router();

router.post(  '/api/v1/token/new',  setupMetaverseAPI,
                                    accountFromAuthToken,
                                    procPostTokenNew,
                                    finishMetaverseAPI );

