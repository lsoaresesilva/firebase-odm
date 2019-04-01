import { OneToOneRelationship } from "./onetoone";
import { ManyToOneRelationship } from "./manytoone";
import { Document } from "./document";
import { OneToManyRelationship } from "./onetomany";

export abstract class RelationshipFactory {

    static get(metaData, property, entityName, fireStore) {
        if (OneToOneRelationship.validate(metaData, property))
            return new OneToOneRelationship(metaData.prototype[OneToOneRelationship._name][entityName].document, property, entityName, fireStore)
        else if(ManyToOneRelationship.validate(metaData,property))
            return new ManyToOneRelationship(metaData.prototype[ManyToOneRelationship._name][entityName].document, property, entityName, fireStore)
        else if(OneToManyRelationship.validate(metaData,property))
            return new OneToManyRelationship(metaData.prototype[OneToManyRelationship._name][entityName].document, property, entityName, fireStore)

        return null;
    }

    static getAllFrom(metaData: Document, fireStore) {

        let allRelationships = [];
        let z = Object.getOwnPropertyNames(metaData["prototype"]);
        z.forEach(property => {
            
            if (property == OneToOneRelationship._name || 
                property == ManyToOneRelationship._name ||
                property == OneToManyRelationship._name) {
                let relationships = this.getAll(metaData, property, fireStore)
                if( relationships.length > 0 )
                    allRelationships.push(relationships)
            }

        });

        return allRelationships;
    }

    static getAll(metaData, relationship, fireStore):any[]{
        // percorrer o objeto, retornar array de relationships de um determinado tipo
        let properties = [];
        if( Array.isArray(metaData.prototype[relationship]) ){
            for(let entityName in metaData.prototype[relationship]){
                
                let relation = RelationshipFactory.get(metaData, 
                                        metaData.prototype[relationship][entityName].property,
                                        entityName, 
                                        fireStore)

                if( relation != null )
                    properties.push(relation);
            }
            
        }

        return properties;


    }
}