# Hyper File Storage

> This is a simple Hyperledger Network illustrates how to run KYC system with file storage using https://composer-playground.mybluemix.net

This business network defines:

**Participant**
`User`
`Manager`

**Asset**
`Document`
`SomeAsset`

**Transaction**
`ProcessDocument`
`SomeTransaction`

**Event**
`DocumentProcessedEvent`
`SomeTransactionEvent`

Documents are owned and created by a User, and than approving by Manager by ProcessDocument transaction. When User have verified IDENTITY and ADDRESS he can create SomeAsset and operate with SomeTransaction.

To test this Business Network Definition in the **Test** tab:

Create a `User` participant:

```
{
  "$class": "io.devorchestra.kyc.User",
  "userId": "userId:3886",
  "verified": false,
  "identity": false,
  "address": false
}
```

Create a `Manager` participant:

```
{
  "$class": "io.devorchestra.kyc.Manager",
  "userId": "userId:9041"
}
```
Go to ID Registry and create Identities for both `User` and `Manager` participants:

Login with `User` Identity and create a `Document` asset

```
{
  "$class": "io.devorchestra.kyc.Document",
  "documentId": "documentId:7374",
  "hash": "none",
  "secret": "none",
  "owner": "resource:io.devorchestra.kyc.User#userId:3886",
  "type": "IDENTITY",
  "status": "INPROGRESS"
}
```

Login with `Manager` and submit `ProcessDocument` transaction

```
{
  "$class": "io.devorchestra.kyc.ProcessDocument",
  "document": "resource:io.devorchestra.kyc.Document#documentId:5730",
  "status": "INPROGRESS"
}
```

