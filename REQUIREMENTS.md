# Requirements

This application allows a user to report observations of geolocation events with photos.

1. A user can submit an observation which includes a description, geo location and photos.
2. All published observations can be viewed by all users.
3. This application will not store any non-public user data other than the data needed to sign in.

### Permissions

For the purposes of permissions, all permissions related to observations also apply to images and observation revisions.

| Permission                  | Description                                                                |
|-----------------------------|----------------------------------------------------------------------------|
| read-published-observations | Read access to all observations.                                           |
| read-all-observations       | Read any observation even if it is unpublished.                            |
| read-own-observations       | Read any observations created by self.                                     | 
| edit-own-observations       | Edit observations that the user created and submit the revision for review |
| delete-own-observations     | Delete observations created by self.                                       |
| delete-all-observations     | Delete  any observation.                                                   |                                                                     
| publish-all-observations    | Publish any observation or observation revision.                           |
| publish-own-observations    | Publish observations or observation revisions created by self.             |
| manage-user-roles           | Grant or revoke permissions from a role.                                   | 



### Roles
Users can have the following roles. Users use the permissions from all of their roles at once.

| Role               | Description                                                                                                                                                 |
|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| security-admin     | Can grant or revoke permissions from a role. Only granted if assigned by someone with security admin or is root user.                                       |
| moderator          | Can read all observations, publish observations and publish observation revisions. Only granted if assigned by someone with security admin or is root user. |
| authenticated-user | Can read own observations and submit revisions to own observations. Automatically granted to all authenticated users.                                       |
| public             | Can read published observations. All users even if not logged in.                                                                                           |
| validated-user     | Can publish own observations. Only granted by security admin or if is root user.                                                                            |

### Users
People can create their own user accounts. The root user is used to bootstrap the access control system. The 
root user is created by environment variables.

### Authentication
Use NextAuth for authentication and use our own user management system. Login with an OAuth2 IdP such as keycloak is 
also supported. User side authentication will use session IDs stored in HTTP only cookies using NextAuth defaults. 
NextAuth password and user name will be directly supported. 

### Role Permissions

| Role               | Permission                  |
|--------------------|-----------------------------|
| security-admin     | manage-user-roles           |
| moderator          | read-all-observations       |
| moderator          | publish-observations        |
| moderator          | delete-all-observations     | 
| authenticated-user | read-own-observations       |
| authenticated-user | edit-own-observations       |
| authenticated-user | delete-own-observations     | 
| public             | read-published-observations |
| validated-user     | publish-own-observations    | 

### Object Model

#### Version Control
Objects are version controlled. Repeated modules should be used to efficiently implement version control on multiple 
object types. The following variables are present in multiple objects and should be used in a repeated way for version 
control and the RBAC model for model revision change management.

| Field                     | Type     | Required |
|---------------------------|----------|----------|
| revision_id               | int      | Yes      |
| id                        | string   | Yes      |                                                        
| updated_at                | datetime | Yes      |
| created_at                | datetime | Yes      |
| revision_created_at       | datetime | Yes      |
| published                 | boolean  | Yes      |
| submitted                 | boolean  | Yes      |
| owner                     | string   | Yes      |



#### Image Revision
| Field                     | Type     | Required | Description                                                                                                |
|---------------------------|----------|----------|------------------------------------------------------------------------------------------------------------|
| revision_id               | int      | Yes      | Primary key for the revision. Auto increments from 0 for each image.                                       |
| id                        | string   | Yes      | UUID of image. An image can have multiple revisions.                                                       |                                                        
| image_key                 | string   | Yes      | Path to object store location of image.                                                                    |
| description               | string   | No       | Description of the revision                                                                                |
| image_metadata_location   | point    | No       | Extracted geo-location of image.                                                                           |                                            
| image_metadata_created_at | datetime | No       | Date and time the revision was created as extracted from the image metadata.                               |
| updated_at                | datetime | Yes      | Date and time the revision was last updated                                                                |
| created_at                | datetime | Yes      | Date and time the image was created                                                                        |
| revision_created_at       | datetime | Yes      | Date and time the image revision was created                                                               |
| published                 | boolean  | Yes      | Is the revision published. Only one version of a revision is published. Published revisions are immutable. |
| submitted                 | boolean  | Yes      | Is the revision submitted for review.                                                                      |
| owner                     | string   | Yes      | The user_id of the user who created the image. |

#### Observation Revision
| Field               | Type         | Required | Description                                                                                                       |
|---------------------|--------------|----------|-------------------------------------------------------------------------------------------------------------------|
| revision_id         | int          | Yes      | Primary key for the revision. Auto increments from 0 for each observation.                                        |
| observation_id      | string       | Yes      | UUID of observation. An observation can have multiple revisions.                                                  |
| description         | string       | No       | Description of the revision                                                                                       |
| image_ids           | list(object) | No       | List of image Id and revision references                                                                          | 
| updated_at          | datetime     | Yes      | Date and time the revision was last updated                                                                       |
| created_at          | datetime     | Yes      | Date and time the observation was created                                                                         |
| revision_created_at | datetime     | Yes      | Date and time the observation revision was created                                                                |
| revision_updated_at | datetime     | Yes      | Date and to time the observation revision was created.                                                            | 
| published           | boolean      | Yes      | Is the revision published. Only one version of a revision is published. Published revisions are immutable.        |
| submitted           | boolean      | Yes      | Is the revision submitted for review.                                                                             |
| owner               | string       | Yes      | The user_id of the user who submitted the revision. Users can ownly create revisions from their own observations. |

