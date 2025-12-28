/**
 * Domain entity representing a broker
 */
export class Broker {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly group: string
  ) {}

  static fromDTO(dto: BrokerDTO): Broker {
    return new Broker(dto.code, dto.name, dto.group);
  }

  toDTO(): BrokerDTO {
    return {
      code: this.code,
      name: this.name,
      group: this.group,
    };
  }
}

export interface BrokerDTO {
  code: string;
  name: string;
  group: string;
}
