import { addDays, isWeekend } from "date-fns";

export default (diasUteis, dataBase = new Date()) => {
  let data = new Date(dataBase);
  let contador = 0;

  while (contador < diasUteis) {
    data = addDays(data, 1);
    if (!isWeekend(data)) contador++;
  }

  return data;
};
