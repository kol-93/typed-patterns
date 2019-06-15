/**
 * Object with typed properties
 */
export interface NameSpace<ValueType = any> {
  [name: string]: ValueType;
}
