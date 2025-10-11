import {getDb} from "@/lib/db";
import {ImageController} from "@/lib/actions/images";
import {ObservationController} from "@/lib/actions/observations"
import {UserController} from "@/lib/actions/users";

export async function getControllers() {
    const db = await getDb();
    return {
        imageController: new ImageController(db),
        observationController: new ObservationController(db),
        userController: new UserController(db)
    }
}