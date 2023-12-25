import React, { useCallback, useState } from "react";
import "./App.css";
import { Box } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ServerConfig from "./Components/ServerConfig";

const theme = createTheme({
  palette: {
    primary: {
      //ORANGE
      main: "#edaf48",
      light: "#fcf7ee",
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      //BLUE
      main: "#435089",
      light: "#c6cce4",
      dark: "#323c66",
      contrastText: "#47008F",
    },
    error: {
      main: "#d15b43",
    },
  },
});

const BACKGROUND_COLOR = "#f1f3f9";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          width: "100vw",
        }}
        bgcolor={BACKGROUND_COLOR}
      >
        <ServerConfig />
      </Box>
    </ThemeProvider>
  );
}

export default App;
