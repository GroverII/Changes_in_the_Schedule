import React from 'react';
import './styles.css';

const Data_table = ({ data, currentDate }) => {
    // Check if the date of the data matches the current date
        return (
            <tr style={{ borderBottom: '5px solid #ddd' }}>
                <td>{data.subst_person}</td>
                <td>{data.lesson}</td>
                <td>{data.class}</td>
                <td>{data.lesson_room}</td>
                <td>{data.graduated_teacher}</td>
                <td>{data.notes}</td>
            </tr>
        );
};

export default Data_table;
