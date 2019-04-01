import { ManyToOneRelationship } from './manytoone';
import { Student } from "./tests/models";

describe('ManyToOneRelationship tests', () => {
    
    it("should create an array with manyToOne relationships", ()=>{
        let s = new Student(null);
        expect(s["_manyToOne"]).toBeDefined();
        expect(s["_manyToOne"]["ClassRoom"]).toBeDefined();
        expect(s["_manyToOne"]["ClassRoom"].document).toBeDefined();
        expect(s["_manyToOne"]["ClassRoom"].property).toBe("class");

        expect(s["_manyToOne"]["ResearchGroup"]).toBeDefined();
        expect(s["_manyToOne"]["ResearchGroup"].document).toBeDefined();
        expect(s["_manyToOne"]["ResearchGroup"].property).toBe("group");
    })

    it("should return an array with relationships", ()=>{
        let s = new Student(null);
        let relationships = ManyToOneRelationship.getFrom(s);
        expect(relationships).toBeDefined();
        expect(s["_manyToOne"]["ClassRoom"]).toBeDefined();
        expect(s["_manyToOne"]["ClassRoom"].document).toBeDefined();
        expect(s["_manyToOne"]["ClassRoom"].property).toBe("class");

        expect(s["_manyToOne"]["ResearchGroup"]).toBeDefined();
        expect(s["_manyToOne"]["ResearchGroup"].document).toBeDefined();
        expect(s["_manyToOne"]["ResearchGroup"].property).toBe("group");
    })

});