function App() {
  return (
    <form
      action={(data) => {
        console.log(data);
      }}
    >
      <input type="text" name="test" />
      <button>Submit</button>
    </form>
  );
}

export default App;
