import {Asset} from './org.hyperledger.composer.system';
import {Participant} from './org.hyperledger.composer.system';
import {Transaction} from './org.hyperledger.composer.system';
import {Event} from './org.hyperledger.composer.system';
// export namespace io.devorchestra.kyc{
   export enum documentType {
      IDENTITY,
      ADDRESS,
   }
   export enum documentStatus {
      INPROGRESS,
      APPROVED,
      REJECTED,
   }
   export class User extends Participant {
      userId: string;
      verified: boolean;
      identity: boolean;
      address: boolean;
   }
   export class Manager extends Participant {
      userId: string;
   }
   export class App extends Participant {
      userId: string;
   }
   export class Document extends Asset {
      documentId: string;
      hash: string;
      secret: string;
      owner: User;
      type: documentType;
      status: documentStatus;
   }
   export class SomeAsset extends Asset {
      assetId: string;
      owner: User;
   }
   export class SomeTransaction extends Transaction {
      asset: SomeAsset;
      newOwner: User;
      oldOwner: User;
   }
   export class ProcessDocument extends Transaction {
      document: Document;
      status: documentStatus;
   }
   export class DocumentUploadedEvent extends Event {
      document: Document;
   }
   export class DocumentProcessedEvent extends Event {
      document: Document;
   }
   export class SomeTransactionEvent extends Event {
      asset: SomeAsset;
   }
// }
