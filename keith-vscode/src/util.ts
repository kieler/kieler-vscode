/**
 * Helper type to construct a tuple from a union.
 * @param T enum to transform into an union
 */
export type Tuple<T> = UnionToIntersection<
T extends never ? never : (t: T) => T
> extends (_: never) => infer W
? [...Tuple<Exclude<T, W>>, W]
: [];

type UnionToIntersection<U> = (
    U extends never ? never : (arg: U) => never
  ) extends (arg: infer I) => void
    ? I
    : never;
