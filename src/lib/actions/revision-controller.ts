'use server'


  // Generic revision document type
import {Collection, Db, Filter, InsertOneResult, ObjectId} from "mongodb";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {Permission, Role, ROLE_PERMISSIONS} from "@/types/rbac";

interface RevisionDocument {
    _id?: ObjectId
    itemId: string
    revisionId: number
    published: boolean
    submitted: boolean
    owner: string
    createdAt?: Date
    updatedAt?: Date
    revisionCreatedAt?: Date
}

class NotFoundError extends Error {}

class NotAuthorizedError extends Error {}

interface UserAuthContext {
    userId?: string
    permissions: Permission[]
}

async function getUserAuthContext() : Promise<UserAuthContext> {
    const session = await getServerSession(authOptions);
    let roles = [Role.PUBLIC];
    if (session?.user?.roles) {
        roles = session.user.roles;
    }
    const permissions = roles.flatMap(role => {
        return ROLE_PERMISSIONS[role]
    }).filter(item => item!);
    return {
        userId : session?.user.id,
        permissions: permissions
    }
}

async function hasReadAccess(document: RevisionDocument) : Promise<boolean> {
    const authContext = await getUserAuthContext();
    return (document.published && Permission.READ_ALL_OBSERVATIONS in authContext.permissions)
    || (document.owner == authContext.userId && Permission.READ_OWN_OBSERVATIONS in authContext.permissions)
    || (Permission.READ_ALL_OBSERVATIONS in authContext.permissions)
}

async function hasEditAccess(document?: RevisionDocument) : Promise<boolean> {
    const authContext = await getUserAuthContext();
    return (!document && Permission.EDIT_OWN_OBSERVATIONS in authContext.permissions)
    || (document! && document.owner == authContext.userId && Permission.EDIT_OWN_OBSERVATIONS in authContext.permissions)
}

async function hasDeleteAccess(document: RevisionDocument) : Promise<boolean> {
    const authContext = await getUserAuthContext();
    return (document.owner == authContext.userId && Permission.DELETE_OWN_OBSERVATIONS in authContext.permissions)
    || (Permission.DELETE_ALL_OBSERVATIONS in authContext.permissions)
}

async function hasPublishAccess(document: RevisionDocument) : Promise<boolean> {
    const authContext = await getUserAuthContext();
    return (document.owner == authContext.userId && Permission.PUBLISH_OWN_OBSERVATIONS in authContext.permissions)
    || (Permission.PUBLISH_ALL_OBSERVATIONS in authContext.permissions)
}

class RevisionController<S, T extends RevisionDocument & S> {

    private collectionName: string;
    private db: Db;

    constructor(
        collectionName: string,
        db: Db
    ) {
        this.collectionName = collectionName;
        this.db = db;
    }

    async getCollection() : Promise<Collection<T>> {
        return this.db.collection(this.collectionName);
    }


    async getLatestRevision(id: string, revisionId: number) : Promise<T> {
        const collection = await this.getCollection();
        const filter = {itemId: id}
        const revisions = await collection.find(filter).sort({revisionId: -1}).limit(1).toArray();
        if (!revisions || revisions.length < 1) {
            throw new NotFoundError(`No revisions found for ${id} in collection ${this.collectionName}`);
        }
        const document = revisions[0] as T;
        if (!hasReadAccess(document)) {
            throw new NotAuthorizedError(`User does not have read access to revision ${revisionId} of ${id}`);
        }
        return revisions[0] as T;
    }

    async createRevision(
        id: string,
        data: S
        ) : Promise<T> {
            const collection = await this.getCollection();
            const latestRevision = await this.getLatestRevision(id, 0);
            if (!hasEditAccess(latestRevision)) {
                throw new NotAuthorizedError(`User does not have edit access to ${id}`);
            }
            const newRevisionData = {
                ...latestRevision,
                ...data,
                itemId: id,
                revisionId: latestRevision.revisionId + 1,
                published: false,
                submitted: true,
                updatedAt: Date.now()
            }

            // Remove _id from the data to insert (MongoDB will generate it)
            const { _id, ...dataToInsert } = newRevisionData

            const result = await collection.insertOne(dataToInsert as any);
            if (!result.acknowledged) {
                throw new Error(`Failed to create revision for ${id}`);
            }

            // Return what we inserted plus the generated _id
            return {
                ...dataToInsert,
                _id: result.insertedId
            } as T;
    }

    async createObject(data: S) : T {
    }

    async deleteRevision(data: S) {}

    async deleteObject(data: S) {}

    async updateRevision(data: S) {}

    async publishRevision(data: S) {}

    async searchObjects(
        userId?: string,
        published?: boolean,
        filter?: Filter<T>
    ) {
        // We will have restrictions on searches by userId and published obeservations based on permissions.
    }
}
