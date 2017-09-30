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

'use strict';

const AdminConnection = require('composer-admin').AdminConnection;
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const bfs_fs = BrowserFS.BFSRequire('fs');

describe('Suite', () => {

    // This is the business network connection the tests will use.
    let businessNetworkConnection;

    // This is the factory for creating instances of types.
    let factory;

    // These are the identities for Alice and Bob.
    let user1Identity;
    let user2Identity;
    let manager1Identity;
    let manager2Identity;

    // These are a list of receieved events.
    let events;

    // This is called before each test is executed.
    beforeEach(() => {

        // Initialize an in-memory file system, so we do not write any files to the actual file system.
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());

        // Create a new admin connection.
        const adminConnection = new AdminConnection({fs: bfs_fs});

        // Create a new connection profile that uses the embedded (in-memory) runtime.
        return adminConnection.createProfile('defaultProfile', {type: 'embedded'})
            .then(() => {

                // Establish an admin connection. The user ID must be admin. The user secret is
                // ignored, but only when the tests are executed using the embedded (in-memory)
                // runtime.
                return adminConnection.connect('defaultProfile', 'admin', 'adminpw');

            })
            .then(() => {

                // Generate a business network definition from the project directory.
                return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));

            })
            .then((businessNetworkDefinition) => {

                // Deploy and start the business network defined by the business network definition.
                return adminConnection.deploy(businessNetworkDefinition);

            })
            .then(() => {

                // Create and establish a business network connection
                businessNetworkConnection = new BusinessNetworkConnection({fs: bfs_fs});
                events = [];
                businessNetworkConnection.on('event', (event) => {
                    events.push(event);
                });
                return businessNetworkConnection.connect('defaultProfile', 'hyper-file-storage', 'admin', 'adminpw');

            })
            .then(() => {

                // Get the factory for the business network.
                factory = businessNetworkConnection.getBusinessNetwork().getFactory();

                // Create the participants.
                const user1 = factory.newResource('io.devorchestra.kyc', 'User', 'user1');
                const user2 = factory.newResource('io.devorchestra.kyc', 'User', 'user2');
                user2.verified = true;
                user2.identity = true;
                user2.address = true;

                const manager1 = factory.newResource('io.devorchestra.kyc', 'Manager', 'manager1');
                const manager2 = factory.newResource('io.devorchestra.kyc', 'Manager', 'manager2');

                let promices = [];
                return Promise.all([
                    businessNetworkConnection.getParticipantRegistry('io.devorchestra.kyc.User')
                        .then((participantRegistry) => {
                            participantRegistry.addAll([user1, user2]);
                        }),
                    businessNetworkConnection.getParticipantRegistry('io.devorchestra.kyc.Manager')
                        .then((participantRegistry) => {
                            participantRegistry.addAll([manager1, manager2]);
                        })
                ]);

            })
            .then(() => {

                // Create the documents.
                const document1 = factory.newResource('io.devorchestra.kyc', 'Document', '1');
                document1.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user1');
                document1.type = 'IDENTITY';
                document1.status = 'INPROGRESS'

                const document2 = factory.newResource('io.devorchestra.kyc', 'Document', '2');
                document2.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user2');
                document2.type = 'IDENTITY';
                document2.status = 'APPROVED'

                return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                    .then((assetRegistry) => {
                        assetRegistry.addAll([document1, document2]);
                    });
            })
            .then(() => {

                // Issue the identities.
                return businessNetworkConnection.issueIdentity('io.devorchestra.kyc.User#user1', 'user1')
                    .then((identity) => {
                        user1Identity = identity;
                        return businessNetworkConnection.issueIdentity('io.devorchestra.kyc.User#user2', 'user2')
                    })
                    .then((identity) => {
                        user2Identity = identity;
                        return businessNetworkConnection.issueIdentity('io.devorchestra.kyc.Manager#manager1', 'manager1')
                    }).then((identity) => {
                        manager1Identity = identity;
                        return businessNetworkConnection.issueIdentity('io.devorchestra.kyc.Manager#manager2', 'manager2')
                    }).then((identity) => {
                        manager2Identity = identity;
                        return true;
                    });
                ;

            });

    });

    /**
     * Reconnect using a different identity.
     * @param {Object} identity The identity to use.
     * @return {Promise} A promise that will be resolved when complete.
     */
    function useIdentity(identity) {
        return businessNetworkConnection.disconnect()
            .then(() => {
                businessNetworkConnection = new BusinessNetworkConnection({fs: bfs_fs});
                events = [];
                businessNetworkConnection.on('event', (event) => {
                    events.push(event);
                });
                return businessNetworkConnection.connect('defaultProfile', 'hyper-file-storage', identity.userID, identity.userSecret);
            });
    }

    describe('UserCanUploadDocument', () => {
        it('User can create Documents', () => {
            return useIdentity(user1Identity)
                .then(() => {
                    const document1 = factory.newResource('io.devorchestra.kyc', 'Document', '3');
                    document1.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user1');
                    document1.type = 'IDENTITY';
                    document1.status = 'INPROGRESS'
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.add(document1);
                        });

                })
                .then((tx) => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.get('3');
                        });
                }).then((doc) => {
                    return doc.owner.getFullyQualifiedIdentifier().should.equal('io.devorchestra.kyc.User#user1');
                });

        });

        it('User can not create Documents assigned to another user', () => {
            return useIdentity(user1Identity)
                .then(() => {
                    const document1 = factory.newResource('io.devorchestra.kyc', 'Document', '3');
                    document1.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user2');
                    document1.type = 'IDENTITY';
                    document1.status = 'INPROGRESS'
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.add(document1);
                        });

                }).should.be.rejected
        });
    })

    describe('UserCanReadHisOwnIdentity', () => {
        it('User1 can read his personal Identity', () => {
            return useIdentity(user1Identity)
                .then(() => {
                    return businessNetworkConnection.getParticipantRegistry('io.devorchestra.kyc.User')
                        .then((assetRegistry) => {
                            return assetRegistry.get('user1');
                        });
                }).then(user => {
                    user.getFullyQualifiedIdentifier().should.equal('io.devorchestra.kyc.User#user1');
                })
        });

        it('User1 can not read another User Identity', () => {
            return useIdentity(user1Identity)
                .then(d => {
                    return businessNetworkConnection.getParticipantRegistry('io.devorchestra.kyc.User')
                        .then((assetRegistry) => {
                            return assetRegistry.get('user2');
                        });
                }).should.be.rejected
        });

        it('User1 can not read Manager Identity', () => {
            return useIdentity(user1Identity)
                .then(d => {
                    return businessNetworkConnection.getParticipantRegistry('io.devorchestra.kyc.Manager')
                        .then((assetRegistry) => {
                            return assetRegistry.get('manager1');
                        });
                }).should.be.rejected
        });
    })

    describe('UserCanReadHisOwnDocuments', () => {
        it('User1 can read only his own Documents', () => {
            return useIdentity(user1Identity)
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.getAll();
                        });
                })
                .then((docs) => {
                    docs.should.have.lengthOf(1);
                    const doc = docs[0];
                    doc.owner.getFullyQualifiedIdentifier().should.equal('io.devorchestra.kyc.User#user1');
                });

        });
    })


    describe('ManagerCanReadUnprocessedDocuments', () => {
        it('Manager can read only Documents with INPROGRESS status', () => {
            return useIdentity(user1Identity)
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.getAll();
                        });
                })
                .then((docs) => {
                    docs.should.have.lengthOf(1);
                    const doc = docs[0];
                    doc.status.should.equal('INPROGRESS')
                });

        });
    })
    describe('ManagerCanProcessDocument', () => {
        it('Manager can process Documents with INPROGRESS status', () => {
            return useIdentity(manager1Identity)
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.get('1');
                        });
                })
                .then((doc) => {
                    const trade = factory.newTransaction('io.devorchestra.kyc', 'ProcessDocument');
                    trade.document = factory.newRelationship('io.devorchestra.kyc', 'Document', '1');
                    trade.status = 'APPROVED'

                    return businessNetworkConnection.submitTransaction(trade);
                }).then(tx => {
                    return useIdentity(user1Identity)
                }).then(() => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.get('1');
                        });
                })
                .then((doc) => {
                    doc.status.should.equal('APPROVED');
                    return businessNetworkConnection.getParticipantRegistry('io.devorchestra.kyc.User')
                        .then((assetRegistry) => {
                            return assetRegistry.get('user1');
                        });
                }).then((user) => {
                    user.identity.should.equal(true)
                });
        });

        it('Manager can not process Documents with no INPROGRESS status', () => {
            return useIdentity(manager1Identity)
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.get('2');
                        });
                }).then((doc) => {
                    const trade = factory.newTransaction('io.devorchestra.kyc', 'ProcessDocument');
                    trade.document = factory.newRelationship('io.devorchestra.kyc', 'Document', '1');
                    trade.status = 'APPROVED'

                    return businessNetworkConnection.submitTransaction(trade);
                }).should.be.rejected
        });

        it('User can not process Documents', () => {
            return useIdentity(user1Identity)
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.get('2');
                        });
                }).then((doc) => {
                    const trade = factory.newTransaction('io.devorchestra.kyc', 'ProcessDocument');
                    trade.document = factory.newRelationship('io.devorchestra.kyc', 'Document', '1');
                    trade.status = 'APPROVED'

                    return businessNetworkConnection.submitTransaction(trade);
                }).should.be.rejected
        });
    })

    describe('ProcessDocument logic', () => {
        it('When Manager approve IDENTITY User.identity becomes true', () => {
            return useIdentity(manager1Identity)
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.get('1');
                        });
                }).then((doc) => {
                    const trade = factory.newTransaction('io.devorchestra.kyc', 'ProcessDocument');
                    trade.document = factory.newRelationship('io.devorchestra.kyc', 'Document', '1');
                    trade.status = 'APPROVED'

                    return businessNetworkConnection.submitTransaction(trade);
                }).then(() => {
                    return useIdentity(user1Identity)
                }).then((doc) => {
                    return businessNetworkConnection.getParticipantRegistry('io.devorchestra.kyc.User')
                        .then((assetRegistry) => {
                            return assetRegistry.get('user1');
                        });
                }).then((user) => {
                    user.identity.should.equal(true)
                });
        });

        it('When Manager reject IDENTITY User.identity becomes false', () => {
            return useIdentity(manager1Identity)
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.get('1');
                        });
                }).then((doc) => {
                    const trade = factory.newTransaction('io.devorchestra.kyc', 'ProcessDocument');
                    trade.document = factory.newRelationship('io.devorchestra.kyc', 'Document', '1');
                    trade.status = 'REJECTED'

                    return businessNetworkConnection.submitTransaction(trade);
                }).then(() => {
                    return useIdentity(user1Identity)
                }).then((doc) => {
                    return businessNetworkConnection.getParticipantRegistry('io.devorchestra.kyc.User')
                        .then((assetRegistry) => {
                            return assetRegistry.get('user1');
                        });
                }).then((user) => {
                    user.identity.should.equal(false)
                });
        });


        it('When Manager approve IDENTITY and ADDRESS User.verify becomes true', () => {
            return useIdentity(user1Identity)
                .then(() => {
                    const document1 = factory.newResource('io.devorchestra.kyc', 'Document', '3');
                    document1.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user1');
                    document1.type = 'ADDRESS';
                    document1.status = 'INPROGRESS'
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.add(document1);
                        });

                }).then(() => {
                    return useIdentity(manager1Identity)
                })
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.get('1');
                        });
                }).then((doc) => {
                    const tx = factory.newTransaction('io.devorchestra.kyc', 'ProcessDocument');
                    tx.document = factory.newRelationship('io.devorchestra.kyc', 'Document', '1');
                    tx.status = 'APPROVED'

                    return businessNetworkConnection.submitTransaction(tx);
                }).then(() => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.Document')
                        .then((assetRegistry) => {
                            return assetRegistry.get('3');
                        });
                }).then((doc) => {
                    const tx = factory.newTransaction('io.devorchestra.kyc', 'ProcessDocument');
                    tx.document = factory.newRelationship('io.devorchestra.kyc', 'Document', '3');
                    tx.status = 'APPROVED'

                    return businessNetworkConnection.submitTransaction(tx);
                }).then(() => {
                    return useIdentity(user1Identity)
                }).then((doc) => {
                    return businessNetworkConnection.getParticipantRegistry('io.devorchestra.kyc.User')
                        .then((assetRegistry) => {
                            return assetRegistry.get('user1');
                        });
                }).then((user) => {
                    user.identity.should.equal(true)
                    user.address.should.equal(true)
                    user.verified.should.equal(true)
                });
        });
    })

    describe('UserCanCreateSomeAssetWhenVerified', () => {
        it('User can create SomeAsset when verified', () => {
            return useIdentity(user2Identity)
                .then(() => {
                    const asset = factory.newResource('io.devorchestra.kyc', 'SomeAsset', '1');
                    asset.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user2');

                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.SomeAsset')
                        .then((assetRegistry) => {
                            return assetRegistry.add(asset);
                        });

                })
                .then((tx) => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.SomeAsset')
                        .then((assetRegistry) => {
                            return assetRegistry.get('1');
                        });
                }).then((asset) => {
                    return asset.owner.getFullyQualifiedIdentifier().should.equal('io.devorchestra.kyc.User#user2');
                });

        });

        it('User can not create SomeAsset assigned to another user', () => {
            return useIdentity(user2Identity)
                .then(() => {
                    const asset = factory.newResource('io.devorchestra.kyc', 'SomeAsset', '1');
                    asset.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user1');

                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.SomeAsset')
                        .then((assetRegistry) => {
                            return assetRegistry.add(asset);
                        });

                }).should.be.rejected
        });

        it('User can not create SomeAsset if he is unverified', () => {
            return useIdentity(user1Identity)
                .then(() => {
                    const asset = factory.newResource('io.devorchestra.kyc', 'SomeAsset', '1');
                    asset.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user1');

                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.SomeAsset')
                        .then((assetRegistry) => {
                            return assetRegistry.add(asset);
                        });

                }).should.be.rejected
        });

        it('User can not read SomeAsset assigned to another user', () => {
            return useIdentity(user2Identity)
                .then(() => {
                    const asset = factory.newResource('io.devorchestra.kyc', 'SomeAsset', '1');
                    asset.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user2');

                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.SomeAsset')
                        .then((assetRegistry) => {
                            return assetRegistry.add(asset);
                        });

                }).then(()=>{
                    return useIdentity(user1Identity)
                }).then(()=>{
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.SomeAsset')
                        .then((assetRegistry) => {
                            return assetRegistry.get('1');
                        });
                }).should.be.rejected
        });
    })

    describe('UserCanSendSomeTransactionWhenVerified', () => {
        it('User can send SomeTransaction when verified', () => {
            return useIdentity(user2Identity)
                .then(() => {
                    const asset = factory.newResource('io.devorchestra.kyc', 'SomeAsset', '1');
                    asset.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user2');

                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.SomeAsset')
                        .then((assetRegistry) => {
                            return assetRegistry.add(asset);
                        });

                }).then(()=>{
                    const tx = factory.newTransaction('io.devorchestra.kyc', 'SomeTransaction');
                    tx.asset = factory.newRelationship('io.devorchestra.kyc', 'SomeAsset', '1');
                    tx.newOwner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user1');
                    tx.oldOwner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user2');
                    return businessNetworkConnection.submitTransaction(tx);
                }).then(()=>{
                    return useIdentity(user1Identity)
                })
                .then((tx) => {
                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.SomeAsset')
                        .then((assetRegistry) => {
                            return assetRegistry.get('1');
                        });
                }).then((asset) => {
                    return asset.owner.getFullyQualifiedIdentifier().should.equal('io.devorchestra.kyc.User#user1');
                });

        });

        it('User can not send SomeTransaction with asset assigned to another user', () => {
            return useIdentity(user2Identity)
                .then(() => {
                    const asset = factory.newResource('io.devorchestra.kyc', 'SomeAsset', '1');
                    asset.owner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user2');

                    return businessNetworkConnection.getAssetRegistry('io.devorchestra.kyc.SomeAsset')
                        .then((assetRegistry) => {
                            return assetRegistry.add(asset);
                        });

                }).then(()=>{
                    const tx = factory.newTransaction('io.devorchestra.kyc', 'SomeTransaction');
                    tx.asset = factory.newRelationship('io.devorchestra.kyc', 'SomeAsset', '1');
                    tx.newOwner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user1');

                    return businessNetworkConnection.submitTransaction(tx);
                }).then(()=>{
                    const tx = factory.newTransaction('io.devorchestra.kyc', 'SomeTransaction');
                    tx.asset = factory.newRelationship('io.devorchestra.kyc', 'SomeAsset', '1');
                    tx.newOwner = factory.newRelationship('io.devorchestra.kyc', 'User', 'user2');

                    return businessNetworkConnection.submitTransaction(tx);
                }).should.be.rejected
        });
    })

});
