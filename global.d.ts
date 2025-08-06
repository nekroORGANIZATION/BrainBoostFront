export {};

declare global {
  interface Window {
    paypal: {
      Buttons: (options: any) => {
        render: (selector: string) => void;
      };
    };
  }
}
