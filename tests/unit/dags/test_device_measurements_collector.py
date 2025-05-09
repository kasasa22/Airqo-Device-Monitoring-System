import pytest
import datetime
from unittest import mock
from airflow.models import DagBag, Variable

from dags.airqo_device_measurements_collector import (
    get_airqo_token,
    fetch_device_measurements,
    process_all_devices
)

class TestDeviceMeasurementsDAG:
    @classmethod
    def setup_class(cls):
        cls.dagbag = DagBag(dag_folder='dags', include_examples=False)
    
    def test_dag_loaded(self):
        """Test that the DAG is loaded correctly"""
        dag = self.dagbag.get_dag(dag_id='airqo_device_measurements_collector')
        assert self.dagbag.import_errors == {}
        assert dag is not None
        assert len(dag.tasks) == 4  # Check correct number of tasks
    
    def test_dependencies(self):
        """Test that the dependencies are set correctly"""
        dag = self.dagbag.get_dag(dag_id='airqo_device_measurements_collector')
        
        setup_task = dag.get_task('setup_tables')
        get_device_ids_task = dag.get_task('get_device_ids')
        process_task = dag.get_task('process_all_devices')
        store_task = dag.get_task('store_site_measurements')
        
        # Test dependencies
        assert setup_task.downstream_list == [get_device_ids_task]
        assert get_device_ids_task.downstream_list == [process_task]
        assert process_task.downstream_list == [store_task]

    @mock.patch.dict('os.environ', {'AIRQO_API_TOKEN': 'test_token'})
    def test_get_airqo_token(self):
        """Test token retrieval from environment variable"""
        token = get_airqo_token()
        assert token == 'test_token'
    
    @mock.patch('dags.airqo_device_measurements_collector.get_airqo_token')
    @mock.patch('dags.airqo_device_measurements_collector.requests.Session')
    def test_fetch_device_measurements(self, mock_session, mock_get_token):
        """Test fetching measurements for a device"""
        # Setup mocks
        mock_get_token.return_value = 'test_token'
        mock_response = mock.MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'success': True,
            'measurements': [
                {'time': '2023-01-01T00:00:00Z', 'pm2_5': {'value': 10.5}}
            ]
        }
        mock_session.return_value.get.return_value = mock_response
        
        # Call the function
        result = fetch_device_measurements('test-device-1')
        
        # Verify the results
        assert result is not None
        assert result['device_id'] == 'test-device-1'
        assert 'data' in result
        assert result['data']['measurements'][0]['pm2_5']['value'] == 10.5