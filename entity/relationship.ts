import { Document } from './document';
import { AngularFirestore } from '@angular/fire/firestore';
import { FireStoreQuery } from './query';
import { RelationshipFactory } from './relationshipFactory';
import { OneToOneRelationship } from './onetoone';

export abstract class Relationship{
    
    requests;
    static _name = "";

    constructor(protected metaData, 
                protected property, 
                protected entityName,
                protected fireStore:AngularFirestore){}

    static validate(metaData:Document, property) {
        if (metaData["prototype"][this._name] != undefined && Array.isArray(metaData["prototype"][this._name])){
            for( let key in metaData["prototype"][this._name] ){
                if( metaData["prototype"][this._name][key].property == property ){
                    if(metaData["prototype"][this._name][key].document != undefined){
                        if (typeof metaData["prototype"][this._name][key].document.constructor.get == "function")
                            return true
                    }
                }
            }
        }

        return false;
    }
    
    abstract query(query:FireStoreQuery);
    
    static getFrom(document){
        return Object.getPrototypeOf(document)[this._name];
    }


}