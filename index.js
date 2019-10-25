'use strict';

const dataElements = require('./weigth');

/**
 * Remove as partes como hidratação, adsorção, etc...
 *
 * HONH2·HCl -> HCl
 * K3[Fe(CN)6]*7H2O -> 7H2O
 *
 * @param formule
 * @returns {[]}
 */
const matchAdsorbed = formule => {
  const matches = formule.match(/([^*·]+)|[·*]+(.+)/g); // Separa as hidratações
  const mols = [];
  if (matches === null) {
    return mols;
  }
  const [mol_formule, mol_adsorbed] = matches.map((part) => {
    return part.trim().replace(/([*·])/g, '');
  });
  if (mol_formule) {
    mols.push(mol_formule);
  }
  if (mol_adsorbed) {
    mols.push(mol_adsorbed);
  }
  return mols;
};

const parseGroups = (formule) => {
  formule = formule.trim().replace(/[[{]/g, '(').replace(/[}\]]/g, ')');
  let position_first_parenteses = 0;
  do {
    position_first_parenteses = formule.indexOf(')');
    for (let i = position_first_parenteses; i >= 0; i--) {
      let caracter = formule[i];
      if (caracter === '(') {
        let group_length = position_first_parenteses - i;
        let part_parenteses = formule.substr(i, group_length + 1);
        let regex = part_parenteses.replace(/[()]/g, '\\$&') + '(?<index>[\\d.,e-]*)';
        let regex_group = new RegExp(regex, '');
        let matches = formule.match(regex_group);

        let index_group = parseFloat(matches.groups.index); // índice do grupo.
        if (isNaN(index_group)) {
          index_group = 1;
        }
        let group_atoms = part_parenteses.replace(/[()]/g, '');

        let remove_part = matches[0];
        formule = formule.replace(remove_part, group_atoms.repeat(index_group));
        break;
      }
    }
  } while (position_first_parenteses > 0);
  return formule;
};

const calculate = formule => {
  if (formule === undefined) {
    return 0;
  }
  let formule_uncollapse = parseGroups(formule);
  let regex = /(?<atom>[A-Z][a-z]*)(?<index>[0-9]*)/g;
  let matches = [...formule_uncollapse.matchAll(regex)];

  let weigth = 0;
  for (let i in matches) {
    let _index = 1;
    const {atom, index} = matches[i].groups;
    if (!isNaN(parseFloat(index))) {
      _index = parseFloat(index);
    }
    weigth += dataElements[atom] * _index;
  }
  return weigth;
};

const calculateAdsorved = formule => {
  if (formule === undefined) {
    return 0;
  }
  let formule_uncollapse = parseGroups(formule); //
  let matchesA = formule_uncollapse.match(/(?<number>[0-9]*)/);
  let multiplicador = parseFloat(matchesA.groups.number);

  let group_without_multiplicator = formule_uncollapse.replace(matchesA.groups.number, '');

  if (isNaN(multiplicador)) {
    multiplicador = 1;
  }

  formule_uncollapse = group_without_multiplicator.repeat(multiplicador);
  return calculate(formule_uncollapse);
};

const Calculator = formule => {
  let [formule_main, formule_adsorved] = matchAdsorbed(formule);
  return calculate(formule_main) + calculateAdsorved(formule_adsorved);
};

module.exports = Calculator;
