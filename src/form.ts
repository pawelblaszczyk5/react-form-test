import { z } from "zod";
import { ComponentPropsWithRef, useState } from "react";

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

type GetInputFromSchema<TSchema extends z.ZodTypeAny> =
  TSchema extends z.ZodEffects<infer TZodObject, any, Pick<FormData, "entries">>
    ? TZodObject extends z.ZodObject<any, any, any, any, infer TInput>
      ? TInput
      : never
    : TSchema extends z.ZodUnion<infer TUnion>
    ? GetInputFromSchema<TUnion[number]>
    : TSchema extends z.ZodIntersection<infer TFirstSchema, infer TSecondSchema>
    ? GetInputFromSchema<TFirstSchema | TSecondSchema>
    : never;

const flattenZodIssues = (issues: Array<z.ZodIssue>): Array<z.ZodIssue> => {
  return issues.flatMap((issue) => {
    if (issue.code === "invalid_union") {
      return issue.unionErrors.flatMap((error) =>
        flattenZodIssues(error.issues)
      );
    }

    return issue;
  });
};

const convertZodErrorIntoMap = (error: z.ZodError) => {
  const flattenedIssues = flattenZodIssues(error.issues);

  const errorMap = new Map<string, Array<string>>();

  flattenedIssues.forEach((issue) => {
    let currentPath = "";

    issue.path.forEach((pathFragment) => {
      currentPath +=
        typeof pathFragment === "string"
          ? `${currentPath === "" ? "" : "."}${pathFragment}`
          : `[${pathFragment}]`;

      const errors = errorMap.get(currentPath) ?? [];

      errors.push(issue.message);

      errorMap.set(currentPath, errors);
    });
  });

  return errorMap;
};

export const useForm = <
  TSchema extends z.ZodTypeAny,
  TInput = GetInputFromSchema<TSchema>,
  TPaths = Paths<TInput>,
  TPathsNormalized extends string = TPaths extends string ? TPaths : never
>({
  schema,
  onSubmit,
}: {
  schema: TSchema;
  onSubmit: (payload: z.output<TSchema>) => void;
}) => {
  const [errors, setErrors] = useState(new Map<string, Array<string>>());

  const action = (formData: FormData) => {
    const parseResult = schema.safeParse(formData);

    if (parseResult.success) {
      onSubmit(parseResult.data);

      return;
    }

    const errorMap = convertZodErrorIntoMap(parseResult.error);

    setErrors(errorMap);
  };

  const form = {
    isInvalid: (path: TPathsNormalized) => errors.has(path),
    getName: (path: TPathsNormalized) => path as string,
    getError: (path: TPathsNormalized) => errors.get(path)?.[0],
    getErrors: (path: TPathsNormalized) => errors.get(path) ?? [],
    formProps: {
      noValidate: true,
      action,
    } satisfies Pick<ComponentPropsWithRef<"form">, "action" | "noValidate">,
  };

  return form;
};
