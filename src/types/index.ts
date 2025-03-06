export interface Driver {
  id: string;
  name: string;
  contact: string;
  carModel: string;
  availability: Availability[];
  discount: {
    enabled: boolean;
    percentage: number;
  };
  ridesOffered: number;
  isSubscribed: boolean;
}

export interface Availability {
  id: string;
  fromArea: string;
  toArea: string;
  startTime: string;
  endTime: string;
  date: string;
}

export interface SearchParams {
  date: string;
  fromArea: string;
  toArea: string;
}