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

import { createPublicKey } from 'crypto';

// The public_key is sent as a binary (DER) form of a PKCS1 key.
// To keep backward compatibility, we convert the PKCS1 key into a SPKI key in PEM format
//      ("PEM" format is "Privacy Enhanced Mail" format and has the "BEGIN" and "END" text included).
export function convertBinKeyToPEM(pBinKey: Buffer): string {
  // Convert the passed binary into a crypto.KeyObject
  const publicKey = createPublicKey( {
    key: pBinKey,
    format: 'der',
    type: 'pkcs1'
  });
  // Convert the public key to 'SubjectPublicKeyInfo' (SPKI) format as a PEM string
  const convertedKey = publicKey.export({ type: 'spki', format: 'pem' });
  return convertedKey as string;
};

// The legacy interface returns public keys as a stripped PEM key.
// "stripped" in that the bounding "BEGIN" and "END" lines have been removed.
// This routine returns a stripped key string from a properly PEM formatted public key string.
export function createSimplifiedPublicKey(pPubKey: string): string {
    let keyLines: string[] = [];
    if (pPubKey) {
      keyLines = pPubKey.split('\n');
      keyLines.shift(); // Remove the "BEGIN" first line
      while (keyLines.length > 1
              && ( keyLines[keyLines.length-1].length < 1 || keyLines[keyLines.length-1].includes('END PUBLIC KEY') ) ) {
        keyLines.pop();   // Remove the "END" last line
      };
    }
    return keyLines.join('');    // Combine all lines into one long string
};