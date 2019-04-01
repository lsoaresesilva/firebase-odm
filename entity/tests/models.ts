import { oneToOne } from "../onetoone";
import { Document } from '../document'
import { manyToOne } from "../manytoone";

export class Person extends Document{
  name;
}

export class ResearchGroup extends Document{

}

export class ClassRoom extends Document{

}

export class Scholarship extends Document{

}

export class Student extends Document {
  @oneToOne({document:Person})
  person;
  @manyToOne({document:ResearchGroup})
  group;
  @manyToOne({document:ClassRoom})
  class;
  @oneToOne({document:Scholarship})
  scholarship;

}

