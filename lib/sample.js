/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Manager process User document
 * @param {io.devorchestra.kyc.ProcessDocument} tx
 * @transaction
 */
function ProcessDocument(tx) {
    // Get the asset registry for the asset.
    return getAssetRegistry('io.devorchestra.kyc.Document')
        .then(function (assetRegistry) {
            tx.document.status = tx.status
            // Update the asset in the asset registry.
            return assetRegistry.update(tx.document);
        }).then(function () {
            return getParticipantRegistry('io.devorchestra.kyc.User')
        }).then(function (participantRegistry) {
            if (tx.status == 'APPROVED') {
                tx.document.owner[tx.document.type.toLowerCase()] = true;
            }
            if (tx.document.owner.identity && tx.document.owner.address) {
                tx.document.owner.verified = true;
            }
            return participantRegistry.update(tx.document.owner)
        })
        .then(function () {
            // Emit an event
            var event = getFactory().newEvent('io.devorchestra.kyc', 'DocumentProcessedEvent');
            event.document = tx.document;
            emit(event);
        });

}


/**
 * Manager process User document
 * @param {io.devorchestra.kyc.SomeTransaction} tx
 * @transaction
 */
function SomeTransaction(tx) {
    return getAssetRegistry('io.devorchestra.kyc.SomeAsset')
        .then(function (assetRegistry) {
            tx.asset.owner = tx.newOwner
            return assetRegistry.update(tx.asset);
        })
        .then(function () {
            var event = getFactory().newEvent('io.devorchestra.kyc', 'SomeTransactionEvent');
            event.asset = tx.asset;
            emit(event);
        });

}