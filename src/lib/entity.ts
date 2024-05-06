import {
    Viewer,
    Entity,
} from "cesium";

/**
 * Generates a random uid
 * @returns string
 */
function uid() {
    const randomHex = () => new Number(~~(Math.random() * 126) + 32).toString(16);
    return new Array(8).fill("").map(randomHex).join("");
}

export class TemporaryEntity {
    id: string = "";
    entity: Entity | undefined;
    viewer: Viewer | undefined;
    constructor(config: Record<string, unknown>, viewer: Viewer) {
        this.id = uid(); // need to generate a random id here.
        this.entity = new Entity({ ...config, id: this.id });
        this.viewer = viewer;
    }

    /**
     * Add the temporary entity to the visualization
     */
    add() {
        if (!this.viewer || !this.entity) return;

        if (this.viewer && this.entity && !this.exists())
            this.viewer.entities.add(this.entity);
    }

    /**
     * Returns the entity instance
     * @returns {Entity}
     */
    get() {
        return this.entity;
    }

    /**
     * Update the
     * @param value cesium entity
     */
    set(value: Entity) {
        // remove the current instance
        this.remove();
        // update it
        this.entity = value;
        // ensure that we're still using the correct id
        this.entity.id = this.id;
        // add the new representation back to the globe
        this.add();
    }

    /**
     * Remove the temporary entity from the globe
     */
    remove() {
        if (this.viewer && this.entity) this.viewer.entities.remove(this.entity);
    }

    /**
     * Returns boolean whether or not the entity is already in the datasource
     * @returns {boolean}
     */
    exists() {
        return !!this.viewer?.entities.getById(this.id);
    }
}