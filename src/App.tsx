import { z } from "zod";

import { zfd } from "zod-form-data";
import { useForm } from "./form";

const schema = zfd
  .formData({
    foo: zfd.text().superRefine((_, ctx) => {
      ctx.addIssue({ message: "bla bla", code: "custom" });
      ctx.addIssue({ message: "bla ble", code: "custom" });
    }),
    bar: z.object({
      baz: zfd.text(z.string().min(3)),
      test: zfd.text(z.string().startsWith("t")),
    }),
    lorem: zfd.repeatableOfType(zfd.numeric()),
  })
  .or(
    zfd.formData({
      aaa: zfd.text(),
    })
  );

function App() {
  const form = useForm({
    schema,
    onSubmit: (payload) => {
      console.log(payload);
    },
  });

  return (
    <form {...form.formProps}>
      <input type="text" name={form.getName("foo")} />
      <span>{form.getError("foo")}</span>
      <input type="text" name={form.getName("bar.baz")} />
      <span>{form.getError("bar.baz")}</span>
      <input type="text" name={form.getName("bar.test")} />
      <span>{form.getError("bar.test")}</span>
      <input type="text" name={form.getName("aaa")} />
      <span>{form.getError("aaa")}</span>
      <input type="text" name={form.getName("lorem")} />
      <span>{form.getError("lorem[0]")}</span>
      <input type="text" name={form.getName("lorem")} />
      <span>{form.getError("lorem[1]")}</span>
      <button>Submit</button>
    </form>
  );
}

export default App;
