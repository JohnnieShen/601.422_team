export const createTheme = jest.fn(() => ({}));
export const ThemeProvider = ({ children }) => <div>{children}</div>;
export const styled = (Component) => Component;
export const useTheme = () => ({});