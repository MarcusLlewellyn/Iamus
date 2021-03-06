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

import { Accounts } from '@Entities/Accounts';
import { PaginationInfo } from '@Entities/EntityFilters/PaginationInfo';
import { AccountScopeFilter } from '@Entities/EntityFilters/AccountScopeFilter';
import { AccountFilterInfo } from '@Entities/EntityFilters/AccountFilterInfo';

import { Logger } from '@Tools/Logging';
import { AccountEntity } from '@Entities/AccountEntity';
import { IsNullOrEmpty } from '@Tools/Misc';

// metaverseServerApp.use(express.urlencoded({ extended: false }));

// Get basic user information
const procGetUsers: RequestHandler = async (req: Request, resp: Response, next: NextFunction) => {
  if (req.vRestResp && req.vAuthAccount) {
    const pager = new PaginationInfo();
    const scoper = new AccountScopeFilter(req.vAuthAccount);
    const infoer = new AccountFilterInfo();
    pager.parametersFromRequest(req);
    infoer.parametersFromRequest(req);

    // Loop through all the filtered accounts and create array of info
    const accts: any[] = [];
    for await (const acct of Accounts.enumerateAsync(pager, infoer, scoper)) {
      accts.push( {
        'accountId': acct.accountId,
        'username': acct.username,
        'images': acct.images,
        'location': buildLocationInfo(acct),
      });
    };

    req.vRestResp.Data = {
      accounts: accts
    };
  }
  next();
};

function buildLocationInfo(pAcct: AccountEntity): any {
  const locInfo: any = {};
  if (IsNullOrEmpty(pAcct.location)) {
    const thing = 5;  // make tslint happy for the moment
  }
  else {
    const thing = 5;  // make tslint happy for the moment
  }

};

// Create a user account using the username and password passed
const procPostUsers: RequestHandler = async (req: Request, resp: Response, next: NextFunction) => {
  if (req.vRestResp) {
    if (req.body && req.body.user) {
      const userName: string = req.body.user.username;
      const userPassword: string = req.body.user.password;
      const userEmail: string = req.body.user.email;
      Logger.debug(`procPostUsers: request to create account for ${userName} with email ${userEmail}`);
      if (checkUsernameFormat(userName)) {
        if (checkEmailFormat(userEmail)) {

          // See if account already exists
          const prevAccount = await Accounts.getAccountWithUsername(userName);
          if (IsNullOrEmpty(prevAccount)) {

            const newAcct = await Accounts.createAccount(userName, userPassword, userEmail);
            if (newAcct) {
              try {
                newAcct.IPAddrOfCreator = req.vSenderKey;
                await Accounts.addAccount(newAcct);
              }
              catch (err) {
                Logger.error('procPostUsers: exception adding user: ' + err);
                req.vRestResp.respondFailure('Exception adding user: ' + err);
              }
            }
            else {
              Logger.debug('procPostUsers: error creating account for ' + userName);
              req.vRestResp.respondFailure('could not create account');
            };
          }
          else {
            req.vRestResp.respondFailure('Account already exists');
          };
        }
        else {
          req.vRestResp.respondFailure('Badly formated email');
        };
      }
      else {
        req.vRestResp.respondFailure('Badly formated username');
      };
    }
    else {
      req.vRestResp.respondFailure('Badly formated request');
    };
  }
  next();
};

function checkUsernameFormat(pUsername: string): boolean {
  return pUsername && /^[a-z0-9+\-_\.]+$/.test(pUsername);
};

function checkEmailFormat(pEmail: string): boolean {
  return pEmail && /^[a-z0-9+\-_\.]+@[a-z0-9-\.]+$/.test(pEmail);
};

export const name = '/api/v1/users';

export const router = Router();

router.get(   '/api/v1/users',                    [ setupMetaverseAPI,
                                                    procGetUsers,
                                                    finishMetaverseAPI ] );
router.post(  '/api/v1/users',                    [ setupMetaverseAPI,
                                                    procPostUsers,
                                                    finishMetaverseAPI ] );