type InternalPaths<
  TObject,
  TPrefix extends string | number
> = TObject extends Date
  ? never
  : TObject extends RegExp
  ? never
  : TObject extends Array<any>
  ? {
      [Key in keyof TObject & number]:
        | (TPrefix extends "" ? `${Key}` : `${TPrefix}[${Key}]`)
        | InternalPaths<
            TObject[Key],
            TPrefix extends "" ? `${Key}` : `${TPrefix}[${Key}]`
          >;
    }[keyof TObject & number]
  : TObject extends Record<PropertyKey, unknown>
  ? {
      [Key in keyof TObject & (string | number)]:
        | (TPrefix extends "" ? `${Key}` : `${TPrefix}.${Key}`)
        | InternalPaths<
            TObject[Key],
            TPrefix extends "" ? `${Key}` : `${TPrefix}.${Key}`
          >;
    }[keyof TObject & (string | number)]
  : never;

export type Paths<TObject> = InternalPaths<TObject, "">;