export interface DropMenu {
  title: string;
  icon?: string;
  children?: DropMenu[];
  disabled?: boolean;
  data?: any;
}