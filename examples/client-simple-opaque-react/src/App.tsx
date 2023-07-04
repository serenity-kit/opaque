import { useCallback, useState } from "react";
import LoginView from "./Login";
import { NavigationProvider } from "./Navigation";
import RegisterView from "./Register";

function App() {
  const [view, setView] = useState("register");
  const navigate = useCallback((location: string) => setView(location), []);
  return (
    <NavigationProvider value={navigate}>
      <div className="p-12 flex flex-col space-y-12 items-center">
        {view === "login" && <LoginView />}
        {view === "register" && <RegisterView />}
      </div>
    </NavigationProvider>
  );
}

export default App;
